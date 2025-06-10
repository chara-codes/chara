"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  TooltipContainer,
  PreviewHeader,
  PreviewContent,
  PreviewType,
  TooltipArrow,
} from "./styles";
import { calculateTooltipPosition } from "./utils";
import { getPreviewContent } from "./preview-content";
import type { ContextItem } from "@chara/core";

export interface ContextTooltipProps {
  item: ContextItem;
  isVisible: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  containerRef?: React.RefObject<HTMLElement>;
}

const ContextTooltip: React.FC<ContextTooltipProps> = ({
  item,
  isVisible,
  anchorRef,
  containerRef,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    position: "right" as "top" | "right" | "bottom" | "left",
  });

  useEffect(() => {
    if (isVisible && anchorRef.current && tooltipRef.current) {
      const newPosition = calculateTooltipPosition(
        anchorRef.current,
        tooltipRef.current,
        containerRef?.current || null,
      );
      setPosition(newPosition);
    }
  }, [isVisible, anchorRef, containerRef]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible && anchorRef.current && tooltipRef.current) {
        const newPosition = calculateTooltipPosition(
          anchorRef.current,
          tooltipRef.current,
          containerRef?.current || null,
        );
        setPosition(newPosition);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible, anchorRef, containerRef]);

  if (!isVisible) return null;

  return (
    <TooltipContainer
      ref={tooltipRef}
      position={position.position}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      data-testid="context-tooltip"
    >
      <TooltipArrow position={position.position} />
      <PreviewHeader>
        {item.name}
        <PreviewType>{item.type}</PreviewType>
      </PreviewHeader>
      <PreviewContent>{getPreviewContent(item)}</PreviewContent>
    </TooltipContainer>
  );
};

export default ContextTooltip;
