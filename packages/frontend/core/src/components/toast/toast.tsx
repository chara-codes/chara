"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X } from "lucide-react";
import styled, { css } from "styled-components";

const ToastProvider = ToastPrimitives.Provider;

// Styled ToastViewport component
const StyledViewport = styled(ToastPrimitives.Viewport)`
  position: fixed;
  top: 0;
  right: 55px;
  z-index: 1003;
  display: flex;
  max-height: 100vh;
  width: 100%;
  flex-direction: column-reverse;
  padding: 1rem;

  @media (min-width: 640px) {
    bottom: 0;
    right: 55px;
    top: auto;
    flex-direction: column;
  }

  @media (min-width: 768px) {
    max-width: 400px;
  }
`;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ ...props }, ref) => <StyledViewport ref={ref} {...props} />);
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// Toast variants
interface ToastVariantProps {
  variant?: "default" | "destructive";
}

// Styled Toast Root component
const StyledToast = styled(ToastPrimitives.Root)<ToastVariantProps>`
  position: relative;
  display: flex;
  width: 100%;
  pointer-events: auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  overflow: hidden;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  padding-right: 2rem;
  background-color: #ffffff;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &[data-swipe="cancel"] {
    transform: translateX(0);
  }

  &[data-swipe="end"] {
    transform: translateX(100%);
  }

  &[data-swipe="move"] {
    transition: none;
  }

  &[data-state="open"] {
    animation: slideInFromTop 0.15s ease-out;
  }

  &[data-state="closed"] {
    animation: fadeOut 0.1s ease-in;
  }

  &[data-swipe="end"][data-state="closed"] {
    animation: slideOutToRight 0.1s ease-out;
  }

  @media (min-width: 640px) {
    &[data-state="open"] {
      animation: slideInFromBottom 0.15s ease-out;
    }
  }

  @keyframes slideInFromTop {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInFromBottom {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }

  ${(props) =>
    props.variant === "default" &&
    css`
      background-color: #ffffff;
      color: #000000;
      border-color: #e2e8f0;
    `}

  ${(props) =>
    props.variant === "destructive" &&
    css`
      background-color: #f43f5e;
      color: #ffffff;
      border-color: #f43f5e;
    `}
`;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    ToastVariantProps
>(({ variant = "default", ...props }, ref) => {
  return <StyledToast ref={ref} variant={variant} {...props} />;
});
Toast.displayName = ToastPrimitives.Root.displayName;

// Styled ToastAction component
const StyledAction = styled(ToastPrimitives.Action)`
  display: inline-flex;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid;
  background-color: transparent;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:focus {
    outline: none;
    box-shadow:
      0 0 0 2px var(--ring, #3b82f6),
      0 0 0 4px var(--background, white);
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .destructive & {
    border-color: rgba(255, 255, 255, 0.4);

    &:hover {
      border-color: rgba(244, 63, 94, 0.3);
      background-color: var(--destructive, #f43f5e);
      color: var(--destructive-foreground, white);
    }

    &:focus {
      box-shadow: 0 0 0 2px #fb7185;
    }
  }
`;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ ...props }, ref) => <StyledAction ref={ref} {...props} />);
ToastAction.displayName = ToastPrimitives.Action.displayName;

// Styled ToastClose component
const StyledClose = styled(ToastPrimitives.Close)`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.25rem;
  color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;

  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }

  &:focus {
    opacity: 1;
    outline: none;
    box-shadow: 0 0 0 2px var(--ring, #3b82f6);
  }

  .destructive & {
    color: rgba(255, 99, 71, 0.7);

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    &:focus {
      box-shadow: 0 0 0 2px #f43f5e;
    }
  }

  ${StyledToast}:hover & {
    opacity: 1;
  }
`;

const IconWrapper = styled.div`
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ ...props }, ref) => (
  <StyledClose ref={ref} toast-close="" {...props}>
    <IconWrapper>
      <X size={16} strokeWidth={2} />
    </IconWrapper>
  </StyledClose>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

// Styled ToastTitle component
const StyledTitle = styled(ToastPrimitives.Title)`
  font-size: 0.875rem;
  font-weight: 600;
`;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ ...props }, ref) => <StyledTitle ref={ref} {...props} />);
ToastTitle.displayName = ToastPrimitives.Title.displayName;

// Styled ToastDescription component
const StyledDescription = styled(ToastPrimitives.Description)`
  font-size: 0.875rem;
  opacity: 0.9;
`;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ ...props }, ref) => <StyledDescription ref={ref} {...props} />);
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
