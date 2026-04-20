import type { FormEvent } from 'react'

type UploadPanelProps = {
  isSubmitting: boolean
  selectedFiles: File[]
  onFileSelection: (fileList: FileList | null) => void
  onFileRemoval: (file: File) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function UploadPanel({
  isSubmitting,
  selectedFiles,
  onFileSelection,
  onFileRemoval,
  onSubmit,
}: UploadPanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Upload</p>
          <h2>File upload form</h2>
        </div>
        <p className="panel-hint">Supported format: .csv</p>
      </div>

      <form className="upload-form" onSubmit={onSubmit}>
        <label className="upload-dropzone" htmlFor="csv-files">
          <span className="upload-title">Drop CSV files here</span>
          <span className="upload-subtitle">or click to choose files from your device</span>
          <span className="upload-subtitle">
            Selecting files again will add them to the current list.
          </span>
          <input
            id="csv-files"
            name="files"
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(event) => {
              onFileSelection(event.target.files)
              event.target.value = ''
            }}
          />
        </label>

        <div className="upload-summary">
          <div className="file-list">
            {selectedFiles.length ? (
              selectedFiles.map((file) => (
                <span className="file-pill" key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <span>{file.name}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="file-pill__remove"
                    onClick={() => onFileRemoval(file)}
                    type="button"
                  >
                    x
                  </button>
                </span>
              ))
            ) : (
              <span className="empty-copy">No files selected yet.</span>
            )}
          </div>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Uploading...' : 'Upload and process'}
          </button>
        </div>
      </form>
    </section>
  )
}
