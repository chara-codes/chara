import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled from "styled-components";

const Overlay = styled(Dialog.Overlay)`
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const Content = styled(Dialog.Content)`
  background-color: white;
  border-radius: 6px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 24px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1001;  
`;

const Title = styled(Dialog.Title)`
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  color: #111827;
`;

const Description = styled(Dialog.Description)`
  margin: 16px 0 24px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: "primary" | "danger" | "default" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "danger" &&
    `
    background-color: #ef4444;
    color: white;
    border: none;
    
    &:hover {
      background-color: #dc2626;
    }
  `}

  ${(props) =>
    props.$variant === "primary" &&
    `
    background-color: #3b82f6;
    color: white;
    border: none;
    
    &:hover {
      background-color: #2563eb;
    }
  `}
  
  ${(props) =>
    props.$variant === "default" &&
    `
    background-color: white;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    
    &:hover {
      background-color: #f9fafb;
    }
  `}
`;

interface ConfirmDialogProps {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  open,
  onOpenChange,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Overlay />
        <Content>
          <Title>{title}</Title>
          <Description>{description}</Description>
          <ButtonGroup>
            <Button $variant="default" onClick={() => onOpenChange(false)}>
              {cancelText}
            </Button>
            <Button
              $variant="danger"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmText}
            </Button>
          </ButtonGroup>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
