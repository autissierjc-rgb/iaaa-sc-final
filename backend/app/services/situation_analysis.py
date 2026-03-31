"""
IAAA · Situation Analysis Service
(Bloc 9 original + Camshaft refactor)

Public interface — unchanged:
  compute_decision_dimensions(card, analysis) → DecisionDimensionsSchema
  compute_decision_type(dims)                 → DecisionType

New public outputs (additive, backward-compatible):
  compute_vulnerability_index(dims) → int   (0–100)
  compute_vulnerability_status(idx) → str   (Routine / Tension / Instability / Regime Shift)

Internal — never in public API response, logs, or error messages:
  _camshaft_score(card, analysis)   → (score: int, level: int)
    Classifies the dynamic complexity of the situation on a 2–7 scale.
    Drives systemic_impact inside compute_decision_dimensions().

Architecture:
  LLM      → structured extraction (card + analysis)
  Camshaft → dynamic classification (internal, invisible to user)
  Radar    → 4 axes derived from Camshaft level + structural components
  Index    → single numeric score derived from radar axes

Pipeline:
  card + analysis
  → _camshaft_score()              [internal: raw_score, level 2–7]
  → compute_decision_dimensions()  [public: low/medium/high axes]
  → compute_decision_type()        [public: decision type label]
  → compute_vulnerability_index()  [public: 0–100 numeric]
  → compute_vulnerability_status() [public: regime label]

V1 PROVISIONAL COEFFICIENTS
  All multipliers prefixed _C_ and all _LEVEL_TO_NUM values are V1 calibration.
  They will be tuned after the first real user situations provide ground truth.
  Do not treat them as fixed — they are starting points, not validated weights.
  Every coefficient is named and isolated to make future tuning easy and auditable.

Invariants:
  - Zero LLM calls in this module. Pure deterministic logic.
  - No side effects. All functions are pure.
  - compute_decision_dimensions() output interface must not change without
    explicit architecture decision + contract migration.
  - The Camshaft model (levels, internal labels) must never appear in
    any API response, log line, or error message.
"""

from app.schemas.generate import SituationCardSchema
from app.schemas.analysis import (
    SituationAnalysisSchema,
    DecisionDimensionsSchema,
    DecisionType,
)


# ── V1 Camshaft coefficients (provisional — tune after real usage) ─────────────
#
# Each coefficient is named explicitly so tuning is transparent.
# Rationale per coefficient:
#   TENSION_PRESSURE  — tensions signal active opposing forces (highest weight)
#   CONSTRAINT_LOCK   — constraints reduce degrees of freedom (high weight)
#   UNCERTAINTY_NOISE — unknown elements amplify unpredictability
#   FORCE_COMPLEXITY  — forces add structural weight (slightly lower: partially
#                       captured by tension and stability signals)
#   TRAJECTORY_SPREAD — multiple trajectories signal divergence (lower: they
#                       can reflect exploration breadth, not just instability)
#   DESTABILIZE_BONUS — destabilizing/opposing forces actively push the system
#   STABILITY_PENALTY — fragile/unstable dynamics are structural amplifiers

_C_TENSION_PRESSURE  = 12
_C_CONSTRAINT_LOCK   = 10
_C_UNCERTAINTY_NOISE = 10
_C_FORCE_COMPLEXITY  = 8
_C_TRAJECTORY_SPREAD = 5
_C_DESTABILIZE_BONUS = 6
_STABILITY_PENALTIES = {"stable": 0, "fragile": 8, "unstable": 16}

# Camshaft level thresholds: (upper_bound_exclusive, level)
# Scores below the bound get that level. Last entry is the max level.
_CAMSHAFT_THRESHOLDS = [
    (20, 2),  # polarity             — two opposing forces, simple structure
    (35, 3),  # dynamic              — movement, reactions emerging
    (50, 4),  # structured_tension   — multiple forces locking against each other
    (65, 5),  # regulated_instability— system under stress but holding
    (80, 6),  # instability          — structural stress exceeding regulation
]
_CAMSHAFT_MAX_LEVEL = 7  # directional_escalation — system moving toward new state

# Numeric values for low/medium/high when computing vulnerability_index
# V1 PROVISIONAL — tune after real usage
_LEVEL_TO_NUM = {"low": 25, "medium": 55, "high": 80}


# ── Internal: Camshaft dynamic classifier ─────────────────────────────────────

def _camshaft_score(
    card:     SituationCardSchema,
    analysis: SituationAnalysisSchema,
) -> tuple[int, int]:
    """
    Internal Camshaft dynamic classifier.

    Scores the structural complexity of the situation from its components.
    Returns (raw_score, level) where level is an integer 2–7.

    Level operational semantics (V1):
      2 — polarity              (two opposing forces, simple structure)
      3 — dynamic               (movement, reaction emerging)
      4 — structured_tension    (multiple forces locking)
      5 — regulated_instability (system under stress but holding)
      6 — instability           (structural stress exceeding regulation)
      7 — directional_escalation(system moving toward a new state)

    INTERNAL — must never appear in any API response, log, or error message.
    V1 PROVISIONAL COEFFICIENTS — see module header.
    """
    tension_count     = len(card.tensions)
    force_count       = len(analysis.forces)
    constraint_count  = len(analysis.constraints)
    uncertainty_count = len(card.uncertainty)
    trajectory_count  = len(analysis.trajectories)

    # Destabilizing and opposing forces actively push the system — weighted separately
    destabilizing = sum(
        1 for f in analysis.forces
        if f.direction in ("destabilize", "oppose")
    )

    stability_penalty = _STABILITY_PENALTIES.get(analysis.dynamics.stability, 0)

    raw_score = (
        tension_count     * _C_TENSION_PRESSURE
        + constraint_count  * _C_CONSTRAINT_LOCK
        + uncertainty_count * _C_UNCERTAINTY_NOISE
        + force_count       * _C_FORCE_COMPLEXITY
        + trajectory_count  * _C_TRAJECTORY_SPREAD
        + destabilizing     * _C_DESTABILIZE_BONUS
        + stability_penalty
    )

    level = _CAMSHAFT_MAX_LEVEL
    for upper_bound, lvl in _CAMSHAFT_THRESHOLDS:
        if raw_score < upper_bound:
            level = lvl
            break

    return raw_score, level


# ── Helpers ───────────────────────────────────────────────────────────────────

def _level(n: int, low: int, high: int) -> str:
    """Map a count to low/medium/high thresholds."""
    if n <= low:  return "low"
    if n >= high: return "high"
    return "medium"


def _max_level(*levels: str) -> str:
    order = {"low": 0, "medium": 1, "high": 2}
    return max(levels, key=lambda l: order.get(l, 0))


def _strength_level(forces) -> str:
    """Summarize a list of Force objects into an overall strength level."""
    if not forces:
        return "low"
    order = {"low": 0, "medium": 1, "high": 2}
    scores = [order.get(f.strength, 0) for f in forces]
    avg = sum(scores) / len(scores)
    if avg >= 1.5: return "high"
    if avg >= 0.7: return "medium"
    return "low"


def _severity_level(constraints) -> str:
    """Summarize a list of Constraint objects into an overall severity level."""
    if not constraints:
        return "low"
    order = {"low": 0, "medium": 1, "high": 2}
    scores = [order.get(c.severity, 0) for c in constraints]
    avg = sum(scores) / len(scores)
    if avg >= 1.5: return "high"
    if avg >= 0.7: return "medium"
    return "low"


def _camshaft_level_to_impact(level: int) -> str:
    """
    Map internal Camshaft level to a systemic_impact signal.
      Level 2–3 → low
      Level 4–5 → medium
      Level 6–7 → high
    One input among three for systemic_impact — not the sole determinant.
    """
    if level <= 3: return "low"
    if level <= 5: return "medium"
    return "high"


# ── Public: compute_decision_dimensions ───────────────────────────────────────

def compute_decision_dimensions(
    card:     SituationCardSchema,
    analysis: SituationAnalysisSchema,
) -> DecisionDimensionsSchema:
    """
    Compute decision dimensions from card + analysis.

    Internally runs the Camshaft classifier to derive a dynamic complexity level,
    which feeds into systemic_impact alongside force strength and stability signals.
    The Camshaft level is consumed here and must not surface beyond this function.

    Output interface unchanged: returns DecisionDimensionsSchema (low/medium/high).

    Axes:
      reversibility   ← constraint severity + constraint count (inverted)
      systemic_impact ← Camshaft level + force strength + dynamics stability
      urgency         ← dynamics.speed + tension count (uncertainty excluded)
      uncertainty     ← card.uncertainty count + destabilizing force count
    """
    # Internal Camshaft classification
    # _cs_score is available for future debugging but not used directly in outputs
    _cs_score, _cs_level = _camshaft_score(card, analysis)
    camshaft_impact = _camshaft_level_to_impact(_cs_level)

    # ── Reversibility ─────────────────────────────────────────────────────────
    constraint_count    = len(card.constraints)
    constraint_severity = _severity_level(analysis.constraints)
    severity_inv  = {"low": "high", "medium": "medium", "high": "low"}
    count_inv     = {"low": "high", "medium": "medium", "high": "low"}
    rev_from_sev  = severity_inv[constraint_severity]
    rev_from_cnt  = count_inv[_level(constraint_count, low=1, high=4)]
    reversibility = (
        "low"    if "low"    in (rev_from_sev, rev_from_cnt) else
        "medium" if "medium" in (rev_from_sev, rev_from_cnt) else
        "high"
    )

    # ── Systemic impact ───────────────────────────────────────────────────────
    # Camshaft level replaces the previous vuln_count_level signal,
    # which was less reliable than structural complexity scoring.
    # Three co-signals: Camshaft complexity, force strength, dynamics stability.
    force_strength   = _strength_level(analysis.forces)
    stability_map    = {"stable": "low", "fragile": "medium", "unstable": "high"}
    stability_signal = stability_map.get(analysis.dynamics.stability, "medium")
    systemic_impact  = _max_level(camshaft_impact, force_strength, stability_signal)

    # ── Urgency ───────────────────────────────────────────────────────────────
    # Driven by dynamics.speed. Bumped one level if tensions are high.
    # Uncertainty is deliberately excluded: uncertain ≠ urgent.
    # A situation can be maximally uncertain with zero time pressure.
    speed_map    = {"slow": "low", "medium": "medium", "fast": "high"}
    speed_signal = speed_map.get(analysis.dynamics.speed, "medium")
    tension_lvl  = _level(len(card.tensions), low=1, high=4)
    if   speed_signal == "low"    and tension_lvl == "high": urgency = "medium"
    elif speed_signal == "medium" and tension_lvl == "high": urgency = "high"
    else:                                                     urgency = speed_signal

    # ── Uncertainty ───────────────────────────────────────────────────────────
    destabilizing = sum(1 for f in analysis.forces if f.direction == "destabilize")
    dest_level    = _level(destabilizing, low=0, high=2)
    card_unc      = _level(len(card.uncertainty), low=1, high=4)
    uncertainty   = _max_level(dest_level, card_unc)

    return DecisionDimensionsSchema(
        reversibility=reversibility,
        systemic_impact=systemic_impact,
        urgency=urgency,
        uncertainty=uncertainty,
    )


# ── Public: compute_decision_type ─────────────────────────────────────────────

def compute_decision_type(dims: DecisionDimensionsSchema) -> DecisionType:
    """
    Classify decision type from the 4 dimensions.

    regime_shift  — high impact + low reversibility + high uncertainty
    structural    — high impact + low/medium reversibility
    experimental  — high uncertainty + high reversibility (recoverable)
    trivial       — low impact + high reversibility
    fallback      — structural (conservative default — see rationale below)

    Fallback rationale: any situation reaching this point has at least
    moderate impact or constraint complexity. Defaulting to trivial or
    experimental would under-weight the decision. Structural is the
    honest, conservative default for medium-complexity situations where
    no sharper rule fired. This is intentional, not a gap.
    """
    hi  = "high"
    lo  = "low"
    med = "medium"

    if dims.systemic_impact == hi and dims.reversibility == lo and dims.uncertainty == hi:
        return "regime_shift"

    if dims.systemic_impact == hi and dims.reversibility in (lo, med):
        return "structural"

    if dims.uncertainty == hi and dims.reversibility == hi:
        return "experimental"

    if dims.systemic_impact == lo and dims.reversibility == hi:
        return "trivial"

    return "structural"


# ── Public: vulnerability index + status ──────────────────────────────────────

def compute_vulnerability_index(dims: DecisionDimensionsSchema) -> int:
    """
    Compute a 0–100 Vulnerability Index from the 4 decision dimensions.

    Formula:
      (impact_num + urgency_num + uncertainty_num + risk_reversibility) / 4

    Where risk_reversibility = 100 - reversibility_num
    (high reversibility = low risk contribution).

    V1 PROVISIONAL numeric mapping — see _LEVEL_TO_NUM.
    Tune these values after real usage provides calibration ground truth.
    """
    impact        = _LEVEL_TO_NUM[dims.systemic_impact]
    urgency       = _LEVEL_TO_NUM[dims.urgency]
    uncertainty   = _LEVEL_TO_NUM[dims.uncertainty]
    reversibility = _LEVEL_TO_NUM[dims.reversibility]
    risk_rev      = 100 - reversibility
    return round((impact + urgency + uncertainty + risk_rev) / 4)


def compute_vulnerability_status(index: int) -> str:
    """
    Map a Vulnerability Index (0–100) to a regime label.

    Calibrated thresholds — locked after V1 10-card evaluation:
      0–44   → Routine        (low structural stress, system regulated)
      45–59  → Tension        (active pressure, system still coherent)
      60–74  → Instability    (structural stress exceeding regulation capacity)
      75–100 → Regime Shift   (system moving toward a genuinely different state)

    These thresholds are NOT provisional — do not adjust without a new evaluation batch.
    Previous thresholds (0–30/31–60/61–80/81+) were too compressed toward Routine.
    """
    if index <= 44: return "Routine"
    if index <= 59: return "Tension"
    if index <= 74: return "Instability"
    return "Regime Shift"


def compute_vulnerability_for(
    card:          SituationCardSchema,
    analysis:      SituationAnalysisSchema,
    decision_type: str,
) -> str:
    """
    Derive who or what is most exposed to the main vulnerability.

    Uses the system name from analysis as the primary signal,
    falling back to a decision_type-based label.

    V1 — deterministic, no LLM call. The system.name from the LLM is
    usually the most precise answer (e.g. "Product launch", "Team cohesion").
    If absent or too generic, falls back to structural defaults.
    """
    # Prefer the system name if it's specific (not a generic placeholder)
    system_name = (analysis.system.name or "").strip()
    generic_names = {"system", "the system", "situation", "context", ""}
    if system_name.lower() not in generic_names and len(system_name) < 60:
        return system_name

    # Fallback by decision type
    fallback = {
        "regime_shift":  "System stability",
        "structural":    "Organizational integrity",
        "experimental":  "Decision confidence",
        "trivial":       "Operational continuity",
    }
    return fallback.get(decision_type, "System stability")
