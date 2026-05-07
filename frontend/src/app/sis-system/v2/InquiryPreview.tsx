type InquiryPreviewProps = {
  buttonLabel: string
  blindSpotCount: number
}

export default function InquiryPreview({ buttonLabel, blindSpotCount }: InquiryPreviewProps) {
  return (
    <details style={{ marginTop: 14 }}>
      <summary
        data-testid="inquiry-preview-button"
        style={{
          display: 'inline-block',
          border: '1px solid #C8951A',
          color: '#1A2E5A',
          background: '#F8EFD8',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          cursor: 'pointer',
          listStyle: 'none',
        }}
      >
        {buttonLabel}
      </summary>

      <p data-testid="inquiry-preview-status" style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.6, margin: '10px 0 0' }}>
        Enquete prete : {blindSpotCount} piste(s) a verifier. Le lancement profond restera separe de la generation
        rapide pour ne pas alourdir Approfondir.
      </p>
    </details>
  )
}
