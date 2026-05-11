import React from 'react';

export default function PlayerSeat({
  player,
  bid,
  tricksWon,
  handSize,
  isCompulsory,
  isCurrentTurn,
  isCurrentBidder,
  phase,
  position,
  isMe,
}) {
  const isActive = isCurrentTurn || isCurrentBidder;
  const hasBid = bid !== undefined && bid !== null;
  const isBot = !!player.isBot;
  const isDesktop = window.innerWidth >= 768;
  const isMobile = !isDesktop;
  const accent = isBot ? '#A7B7FF' : '#FFE08A';
  const avatarText = isBot ? 'AI' : player.name?.[0]?.toUpperCase() || '?';
  const activeBadgeText = phase === 'bidding' ? 'BID' : '...';

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 7 : 10,
    padding: isMobile ? '7px 9px 8px 7px' : '9px 13px 10px 9px',
    borderRadius: isMobile ? 15 : 18,
    background: isActive
      ? isBot
        ? 'radial-gradient(circle at 12% 0%, rgba(199,210,254,0.26), transparent 54%), linear-gradient(120deg, rgba(125,92,255,0.34), rgba(17,34,64,0.96) 58%, rgba(7,20,38,0.9))'
        : 'radial-gradient(circle at 12% 0%, rgba(255,224,138,0.25), transparent 54%), linear-gradient(120deg, rgba(214,168,79,0.2), rgba(7,20,38,0.9) 58%, rgba(4,14,26,0.86))'
      : isBot
      ? 'radial-gradient(circle at 12% 0%, rgba(167,183,255,0.14), transparent 54%), linear-gradient(120deg, rgba(42,61,105,0.86), rgba(12,22,44,0.72))'
      : 'radial-gradient(circle at 12% 0%, rgba(255,255,255,0.1), transparent 54%), linear-gradient(120deg, rgba(16,39,67,0.74), rgba(7,20,38,0.58))',
    border: isActive
      ? isBot ? '1.5px solid rgba(199,210,254,0.9)' : '1.5px solid rgba(255,224,138,0.92)'
      : isBot ? '1px solid rgba(167,183,255,0.34)' : '1px solid rgba(255,255,255,0.10)',
    boxShadow: isActive
      ? isBot
        ? isDesktop ? '0 5px 12px rgba(0,0,0,0.18), 0 0 18px rgba(125,92,255,0.28), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 12px 26px rgba(0,0,0,0.3), 0 0 22px rgba(125,92,255,0.36), inset 0 1px 0 rgba(255,255,255,0.08)'
        : isDesktop ? '0 5px 12px rgba(0,0,0,0.18), 0 0 18px rgba(255,224,138,0.22), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 12px 26px rgba(0,0,0,0.3), 0 0 22px rgba(255,224,138,0.28), inset 0 1px 0 rgba(255,255,255,0.08)'
      : isBot
      ? isDesktop ? '0 3px 8px rgba(0,0,0,0.14), inset 0 0 14px rgba(99,179,237,0.06)' : '0 8px 18px rgba(0,0,0,0.2), inset 0 0 18px rgba(99,179,237,0.08)'
      : isDesktop ? '0 3px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 8px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
    minWidth: isMobile ? 118 : 158,
    maxWidth: isMobile ? 132 : 198,
    minHeight: isMobile ? 58 : 68,
    flex: '0 0 auto',
    transition: 'all 0.3s ease',
    animation: isActive ? 'seat-active-pulse 1.45s ease-in-out infinite' : 'none',
    position: 'relative',
    overflow: 'visible',
    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <div style={containerStyle}>
      {isActive && (
        <div style={{
          position: 'absolute',
          top: isMobile ? -8 : -10,
          right: isMobile ? -5 : -7,
          minWidth: isMobile ? 24 : 30,
          height: isMobile ? 20 : 23,
          padding: isMobile ? '0 6px' : '0 8px',
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isBot
            ? 'linear-gradient(145deg, rgba(199,210,254,0.98), rgba(125,92,255,0.9))'
            : 'linear-gradient(145deg, rgba(255,240,176,0.98), rgba(214,168,79,0.94))',
          border: '1px solid rgba(255,255,255,0.34)',
          color: '#071426',
          fontSize: isMobile ? '0.56rem' : '0.64rem',
          fontWeight: 1000,
          letterSpacing: phase === 'bidding' ? '0.05em' : '0.08em',
          lineHeight: 1,
          boxShadow: isBot
            ? '0 8px 18px rgba(0,0,0,0.26), 0 0 14px rgba(167,183,255,0.32)'
            : '0 8px 18px rgba(0,0,0,0.26), 0 0 14px rgba(255,224,138,0.34)',
          animation: 'active-badge-breathe 1.35s ease-in-out infinite',
          zIndex: 3,
        }}>
          {activeBadgeText}
        </div>
      )}

      {isCompulsory && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, #FFE08A, #D6A84F)',
          color: '#091626',
          fontSize: '0.55rem',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 5,
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}>
          DEALER
        </div>
      )}

      <div style={{
        width: isMobile ? 34 : 42,
        height: isMobile ? 34 : 42,
        borderRadius: '50%',
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isBot
          ? 'linear-gradient(145deg, #C7D2FE, #7D5CFF 62%, #2A3D69)'
          : 'linear-gradient(145deg, #FFF6D4, #D6A84F 62%, #8B5B1E)',
        border: isActive ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.22)',
        color: '#071426',
        fontSize: isMobile ? (isBot ? '0.62rem' : '0.82rem') : (isBot ? '0.72rem' : '0.98rem'),
        fontWeight: 900,
        boxShadow: isActive
          ? `0 0 18px ${isBot ? 'rgba(167,183,255,0.42)' : 'rgba(255,224,138,0.42)'}, inset 0 1px 0 rgba(255,255,255,0.48)`
          : 'inset 0 1px 0 rgba(255,255,255,0.44)',
        letterSpacing: isBot ? '0.02em' : 0,
      }}>
        {avatarText}
      </div>

      <div style={{
        minWidth: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 3 : 5,
      }}>
      {/* Player name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 5,
        fontSize: isMobile ? '0.76rem' : '0.88rem',
        fontWeight: 800,
        color: isActive ? (isBot ? '#C7D2FE' : '#FFE08A') : '#F4F7FF',
        textAlign: 'center',
        maxWidth: isMobile ? 74 : 132,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
        {isMe && (
          <span style={{ fontSize: isMobile ? '0.56rem' : '0.62rem', color: '#C8BA9D', marginLeft: 4 }}>(you)</span>
        )}
      </div>

      {/* Bid / Tricks info */}
      {phase !== 'bidding' || hasBid ? (
        <div style={{
          display: 'flex',
          gap: isMobile ? 4 : 7,
          fontSize: isMobile ? '0.58rem' : '0.7rem',
          color: '#C8BA9D',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}>
          {hasBid && (
            <span style={{
              padding: isMobile ? '1px 4px' : '1px 6px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>Bid <strong style={{ color: '#FFF6E6' }}>{bid}</strong></span>
          )}
          {phase === 'playing' && tricksWon !== undefined && (
            <span style={{
              padding: isMobile ? '1px 4px' : '1px 6px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>Won <strong style={{
              color: tricksWon === bid ? '#6EE7B7' : '#FFF6E6',
            }}>{tricksWon}</strong></span>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
