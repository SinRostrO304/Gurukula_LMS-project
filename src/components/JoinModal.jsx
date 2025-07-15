// src/components/JoinModals.jsx
import React, { useRef } from "react";

const JoinModal = ({ isOpen, onClose }) => {
  const modalRef = useRef();

  const handleModalClick = (e) => {
    if (modalRef.current && modalRef.current === e.target) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="joinClassModal" className="modal" ref={modalRef} onClick={handleModalClick}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <p>
          You are currently signed in as <strong>Lahiru Weerasekara</strong>
        </p>
        <label htmlFor="classCode">Class Code</label>
        <input type="text" id="classCode" placeholder="Enter class code here" />
        <small>
          Ask your teacher for class code and then enter it here,
        </small>
        <button id="nextButton" className="btn">
          Next
        </button>
      </div>
    </div>
  );
};

export default JoinModal;