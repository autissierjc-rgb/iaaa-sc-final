export const COLORS = {
  blue:   { solid: '#378ADD', bg: '#E6F1FB', pastel: '#B8D4F0', stroke: '#7AAEDC', dark: '#185FA5', text: '#fff' },
  yellow: { solid: '#EAB308', bg: '#FEF9C3', pastel: '#F0CA70', stroke: '#D4A040', dark: '#A16207', text: '#A16207' },
  red:    { solid: '#E24B4A', bg: '#FCEBEB', pastel: '#E87C7C', stroke: '#C85858', dark: '#A32D2D', text: '#fff' },
  absent: { solid: '#E0DCD4', bg: '#F7F6F3', stroke: '#C8C4BC', dark: '#9A9890', text: '#9A9890' },

  score: {
    0: { solid: '#E0DCD4', stroke: '#C8C4BC' },
    1: { solid: '#B8D4F0', stroke: '#7AAEDC' },
    2: { solid: '#F0CA70', stroke: '#D4A040' },
    3: { solid: '#E87C7C', stroke: '#C85858' },
  } as Record<number, { solid: string; stroke: string }>,

  state: {
    'Stable':        { border: '#378ADD', bg: '#E6F1FB', text: '#185FA5', solid: '#378ADD' },
    'Contrôlable':   { border: '#3B82F6', bg: '#EEF6FF', text: '#1D4ED8', solid: '#3B82F6' },
    'Vigilance':     { border: '#EAB308', bg: '#FEF9C3', text: '#A16207', solid: '#EAB308' },
    'Critique':      { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', solid: '#E24B4A' },
    'Hors contrôle': { border: '#9B1515', bg: '#F5DADA', text: '#7B0F0F', solid: '#9B1515' },
  } as Record<string, { border: string; bg: string; text: string; solid: string }>,

  trajectory: {
    'Stabilisation':  { border: '#378ADD', bg: '#E6F1FB', text: '#185FA5' },
    'Escalation':     { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
    'Solution tiers': { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  } as Record<string, { border: string; bg: string; text: string }>,

  confidence: {
    'élevée':  { solid: '#378ADD', textOnSolid: '#fff', bg: '#E6F1FB', text: '#185FA5' },
    'modérée': { solid: '#EAB308', textOnSolid: '#A16207', bg: '#FEF9C3', text: '#A16207' },
    'faible':  { solid: '#E24B4A', textOnSolid: '#fff', bg: '#FCEBEB', text: '#A32D2D' },
  } as Record<string, { solid: string; textOnSolid: string; bg: string; text: string }>,

  bg:      '#F7F6F3',
  bg2:     '#FFFFFF',
  border:  '#E2E0D8',
  border2: '#D0CEC4',
  text:    '#1A1916',
  text2:   '#5A5852',
  text3:   '#9A9890',
  navy:    '#1F3864',
  gold:    '#E8B84B',
  brass: { light: '#D4C8A8', mid: '#C4B078', dark: '#A89050', ring: '#B8A880' },
}

export const SCORE_LABELS: Record<number, string> = {
  0: 'Absent', 1: 'Actif', 2: 'Modéré', 3: 'Dominant',
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
