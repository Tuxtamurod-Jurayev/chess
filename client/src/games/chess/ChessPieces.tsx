import React from 'react';

interface ChessPieceIconProps {
  piece: string;
  className?: string;
}

export const ChessPieceIcon: React.FC<ChessPieceIconProps> = ({ piece, className = 'w-full h-full' }) => {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  const whiteFill = '#ffffff';
  const whiteStroke = '#222222';
  const blackFill = '#1c1917';
  const blackStroke = '#f5f5f4';

  switch (type) {
    case 'k': // King
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.5 11.63V6M20 8h5" strokeWidth="1.5" />
              <path
                d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-5s-2.5-3-10-3-10 3-10 3v5"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M11.5 30c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0"
                stroke={whiteStroke}
              />
              <circle cx="22.5" cy="20" r="2.5" fill={whiteFill} stroke={whiteStroke} />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" stroke={blackStroke} strokeWidth="1.5" />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-5s-2.5-3-10-3-10 3-10 3v5"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M11.5 30c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0"
              stroke={blackStroke}
            />
            <circle cx="22.5" cy="20" r="2.5" fill={blackFill} stroke={blackStroke} />
          </g>
        </svg>
      );

    case 'q': // Queen
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM15 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm19 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M9 26c8.5-1.5 18.5-1.5 27 0l2-12-7 11-6-13-2.5 13-6-11-2 12-5.5-11z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 4c3.5-1 17.5-1 21 0m-21 4c3.5-1 17.5-1 21 0"
                stroke={whiteStroke}
              />
              <path
                d="M11.5 37.5c5.5 3.5 16.5 3.5 22 0v-4s-3.5-3.5-11-3.5-11 3.5-11 3.5v4z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM15 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm19 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M9 26c8.5-1.5 18.5-1.5 27 0l2-12-7 11-6-13-2.5 13-6-11-2 12-5.5-11z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 4c3.5-1 17.5-1 21 0m-21 4c3.5-1 17.5-1 21 0"
              stroke={blackStroke}
            />
            <path
              d="M11.5 37.5c5.5 3.5 16.5 3.5 22 0v-4s-3.5-3.5-11-3.5-11 3.5-11 3.5v4z"
              fill={blackFill}
              stroke={blackStroke}
            />
          </g>
        </svg>
      );

    case 'r': // Rook
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M9 39h27v-5H9v5zm3-5V20.5h21V34H12zm2-13.5l1-7h15l1 7H14z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M12 9v5h4v-3h5v3h4v-3h5v3h4V9H12z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path d="M14 26.5h17m-17 4h17" stroke={whiteStroke} />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M9 39h27v-5H9v5zm3-5V20.5h21V34H12zm2-13.5l1-7h15l1 7H14z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M12 9v5h4v-3h5v3h4v-3h5v3h4V9H12z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path d="M14 26.5h17m-17 4h17" stroke={blackStroke} />
          </g>
        </svg>
      );

    case 'b': // Bishop
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <g fill={whiteFill} stroke={whiteStroke}>
                <path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.3.5-2.3.5-3-.5 1.4-1.5 3-2 3-2z" />
                <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
                <circle cx="22.5" cy="8" r="2" />
              </g>
              <path d="M17.5 26h10M15 30h15m-7.5-16v6m-3-3h6" stroke={whiteStroke} />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <g fill={blackFill} stroke={blackStroke}>
              <path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.3.5-2.3.5-3-.5 1.4-1.5 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <circle cx="22.5" cy="8" r="2" />
            </g>
            <path d="M17.5 26h10M15 30h15m-7.5-16v6m-3-3h6" stroke={blackStroke} />
          </g>
        </svg>
      );

    case 'n': // Knight
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path
                d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0-.64 1.41-2 1-1-.41-1.58-2.48.5-3 2.5-1 3.5-4.5 3.5-7.5s-2-6-5-7c1.5-1.5 4.5-.5 6 .5 1.5 1 2 2.5 4 3 1.5 0 3-1 4-1.5 1.5-.5 3-1 4 0z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <circle cx="9.5" cy="25.5" r="1" fill={whiteStroke} />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0-.64 1.41-2 1-1-.41-1.58-2.48.5-3 2.5-1 3.5-4.5 3.5-7.5s-2-6-5-7c1.5-1.5 4.5-.5 6 .5 1.5 1 2 2.5 4 3 1.5 0 3-1 4-1.5 1.5-.5 3-1 4 0z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <circle cx="9.5" cy="25.5" r="1" fill={blackStroke} />
          </g>
        </svg>
      );

    case 'p': // Pawn
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            <g fill="none" fillRule="evenodd" stroke={whiteStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.06-3.09 1.44-5.38 4.67-5.38 8.44h19c0-3.77-2.29-7-5.38-8.44 1.45-1.22 2.38-3.03 2.38-5.06 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
                fill={whiteFill}
                stroke={whiteStroke}
              />
              <path d="M12 39h21v-3H12v3z" fill={whiteFill} stroke={whiteStroke} />
            </g>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
          <g fill="none" fillRule="evenodd" stroke={blackStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.06-3.09 1.44-5.38 4.67-5.38 8.44h19c0-3.77-2.29-7-5.38-8.44 1.45-1.22 2.38-3.03 2.38-5.06 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill={blackFill}
              stroke={blackStroke}
            />
            <path d="M12 39h21v-3H12v3z" fill={blackFill} stroke={blackStroke} />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
