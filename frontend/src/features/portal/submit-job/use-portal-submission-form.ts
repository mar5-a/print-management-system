import { useState } from 'react'
import type { PortalSubmissionDraft } from '@/types/portal'

const initialDraft: PortalSubmissionDraft = {
  fileName: '',
  pages: 10,
  copies: 1,
  colorMode: 'Black & White',
  paperType: 'Standard',
  duplex: true,
}

export function usePortalSubmissionForm() {
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<PortalSubmissionDraft>(initialDraft)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setFile(null)
    setDraft(initialDraft)
  }

  return {
    draft,
    feedback,
    file,
    isSubmitting,
    resetForm,
    setDraft,
    setFeedback,
    setFile,
    setIsSubmitting,
  }
}
