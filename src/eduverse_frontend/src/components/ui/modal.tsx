import * as React from 'react';

export interface ModalProps {
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  message?: string;
  handle: () => void;
}

export default function Modal({ state, message, handle }: ModalProps) {
  const [show, setShow] = state;

  if (!show) return null;

  return (
    <dialog className="modal modal-open" onClick={() => setShow(false)}>
      <div
        className="modal-box bg-base-300 shadow-primary space-y-6 p-6 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold">Konfirmasi Logout</h3>
        <p>Are you sure want to logout?</p>
        <div className="modal-action">
          <button
            onClick={async () => {
              await handle();
              setShow(false);
            }}
            className="btn btn-error"
          >
            {message || 'Confirm'}
          </button>
          <button onClick={() => setShow(false)} className="btn">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
