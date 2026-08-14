"use client";

import { useEffect } from "react";

type ScrollLockStyleSnapshot = {
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  rootOverflow: string;
  rootOverscrollBehavior: string;
};

let activeModalLocks = 0;
let styleSnapshot: ScrollLockStyleSnapshot | null = null;

const preventBackgroundTouchMove = (event: TouchEvent) => {
  const target = event.target;
  const isInsideModalScrollArea = target instanceof Element && target.closest("[data-modal-scroll]");

  if (!isInsideModalScrollArea) event.preventDefault();
};

const lockPageScroll = () => {
  if (activeModalLocks === 0) {
    const body = document.body;
    const root = document.documentElement;

    styleSnapshot = {
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      rootOverflow: root.style.overflow,
      rootOverscrollBehavior: root.style.overscrollBehavior,
    };

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    document.addEventListener("touchmove", preventBackgroundTouchMove, { passive: false });
  }

  activeModalLocks += 1;
};

const unlockPageScroll = () => {
  activeModalLocks = Math.max(0, activeModalLocks - 1);
  if (activeModalLocks > 0) return;

  document.removeEventListener("touchmove", preventBackgroundTouchMove);

  if (!styleSnapshot) return;

  const body = document.body;
  const root = document.documentElement;
  body.style.overflow = styleSnapshot.bodyOverflow;
  body.style.overscrollBehavior = styleSnapshot.bodyOverscrollBehavior;
  root.style.overflow = styleSnapshot.rootOverflow;
  root.style.overscrollBehavior = styleSnapshot.rootOverscrollBehavior;
  styleSnapshot = null;
};

export const useModalScrollLock = () => {
  useEffect(() => {
    lockPageScroll();
    return unlockPageScroll;
  }, []);
};
