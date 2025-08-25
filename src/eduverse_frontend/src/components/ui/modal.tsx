import * as React from 'react';

export interface ModalProps {
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  onProcessMessage?: string;
  handle: () => Promise<void>;
  header?: string;
  description?: string;
  name: string;
}

export default function Modal({
  state,
  onProcessMessage,
  header,
  description,
  handle,
  name,
}: ModalProps) {
  const [show, setShow] = state;
  const [loading, setLoading] = React.useState(false);

  if (!show) return null;

  return (
    <dialog className="modal modal-open" onClick={() => setShow(false)}>
      <div
        className="modal-box bg-base-300 shadow-primary space-y-6 p-6 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold">{header || 'Dialog'}</h3>
        {description && <p>{description}</p>}
        <div className="modal-action">
          <button
            onClick={async () => {
              setLoading(true);
              await handle();
              setLoading(false);
              setShow(false);
            }}
            className="btn btn-error"
            disabled={loading}
          >
            {loading ? onProcessMessage || 'Working in...' : name || 'Confirm'}
          </button>
          <button onClick={() => setShow(false)} className="btn">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
