import styled from 'styled-components';
import { Button } from '@strapi/design-system';

// Mobile-optimized button that centers icons properly
export const MobileButton = styled(Button)`
  @media screen and (max-width: 768px) {
    padding: 12px !important;
    min-width: 48px;
    min-height: 48px;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    
    /* Center all span elements (icon containers) */
    & > span,
    & span {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      height: auto !important;
    }
    
    /* Center SVG icons */
    svg {
      width: 20px !important;
      height: 20px !important;
      margin: 0 !important;
      display: block !important;
      flex-shrink: 0;
    }
  }
`;

// Icon-only button for mobile (hides text)
export const MobileIconButton = styled(Button)`
  @media screen and (max-width: 768px) {
    padding: 0 !important;
    font-size: 0;
    min-width: 48px;
    min-height: 48px;
    width: 48px;
    height: 48px;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    
    /* Center all span elements */
    & > span,
    & span {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      font-size: 0 !important;
      line-height: 0 !important;
    }
    
    /* Center SVG icons */
    svg {
      width: 20px !important;
      height: 20px !important;
      margin: 0 !important;
      display: block !important;
      flex-shrink: 0;
    }
    
    /* Hide text content on mobile */
    & > span > span:not(:has(svg)) {
      display: none !important;
      visibility: hidden !important;
    }
  }
`;
