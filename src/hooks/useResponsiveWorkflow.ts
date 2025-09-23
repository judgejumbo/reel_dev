"use client"

import { useMemo } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import MobileStepLayout from "@/components/mobile/MobileStepLayout"
import DesktopTabLayout from "@/components/desktop/DesktopTabLayout"

export const useResponsiveWorkflow = () => {
  const isMobile = useMediaQuery("(max-width: 767px)")

  const WorkflowComponent = useMemo(() => {
    return isMobile ? MobileStepLayout : DesktopTabLayout
  }, [isMobile])

  const viewport = useMemo(() => ({
    isMobile,
    isDesktop: !isMobile,
    timelineStyle: isMobile ? "touch-friendly" : "precise",
    navigationStyle: isMobile ? "stepper" : "tabs"
  }), [isMobile])

  return {
    WorkflowComponent,
    viewport
  }
}

export default useResponsiveWorkflow