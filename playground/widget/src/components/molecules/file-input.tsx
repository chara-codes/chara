"use client"

import type React from "react"
import { forwardRef } from "react"
import styled from "styled-components"

interface FileInputProps {
  onFileSelect: (file: File) => void
  accept?: string
  multiple?: boolean
  children?: React.ReactNode
}

const HiddenInput = styled.input`
  display: none;
`

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ onFileSelect, accept, multiple = false, children }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        if (multiple) {
          Array.from(files).forEach((file) => onFileSelect(file))
        } else {
          onFileSelect(files[0])
        }
      }
      // Reset the input value so the same file can be selected again
      e.target.value = ""
    }

    return (
      <>
        <HiddenInput type="file" ref={ref} onChange={handleChange} accept={accept} multiple={multiple} />
        {children}
      </>
    )
  },
)

FileInput.displayName = "FileInput"

export default FileInput
