import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useLandingConfig } from "../context/LandingConfigContext";

const WhatsAppChannelFloatingIcon = () => {
  const { landingConfig, loadingConfig } = useLandingConfig();
  
  const whatsappChannel = landingConfig?.whatsappChannel;

  if (loadingConfig || !whatsappChannel) return null;

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      style={{
        position: 'fixed',
        right: '0px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(whatsappChannel, "_blank")}
    >
      {/* Tooltip on Top */}
      <div 
        style={{ 
          position: 'absolute',
          right: '8px',
          bottom: '100%',
          marginBottom: '12px',
          padding: '6px 12px',
          backgroundColor: 'white', 
          color: '#25D366', 
          border: '1px solid rgba(37, 211, 102, 0.2)',
          borderRadius: '8px',
          fontWeight: '900',
          fontSize: '11px',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
          textTransform: 'uppercase',
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? 'visible' : 'hidden',
          transform: `translateY(${isHovered ? '0px' : '8px'})`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        Join Channel
        {/* Tooltip arrow pointing down */}
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '16px',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid white',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
        }}></div>
      </div>

      {/* Main Icon Button */}
      <div 
        style={{ 
          width: isHovered ? '64px' : '56px',
          height: '56px',
          backgroundColor: '#25D366',
          borderTopLeftRadius: '16px',
          borderBottomLeftRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(37, 211, 102, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          filter: 'blur(8px)',
          transform: `scale(${isHovered ? 1.5 : 0})`,
          transition: 'transform 0.5s ease'
        }}></div>
        
        {/* We use FaWhatsapp from react-icons */}
        <FaWhatsapp 
          size={32} 
          color="white" 
          style={{
            position: 'relative',
            zIndex: 10,
            transform: `scale(${isHovered ? 1.1 : 1})`,
            transition: 'transform 0.3s ease'
          }}
        />
        
        {/* Notification Ping Badge */}
        <span className="absolute top-2 right-2 flex h-3 w-3 z-20" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', width: '12px', height: '12px', zIndex: 20 }}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f87171', opacity: 0.75 }}></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" style={{ position: 'relative', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', border: '1px solid #25D366' }}></span>
        </span>
      </div>
    </div>
  );
};

export default WhatsAppChannelFloatingIcon;
