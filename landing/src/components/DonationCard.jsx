const statBox = { background: '#f8fafc', padding: '6px 4px', borderRadius: '6px' };

const infoCards = [
  { icon: '❤️', title: 'Saves Lives', copy: 'Helps patients get timely medical treatment.', bg: '#eff6ff', border: '#1d4ed8', titleColor: '#1e40af', copyColor: '#1d4ed8' },
  { icon: '🏥', title: 'Patient Care', copy: 'Allocated for critical surgeries & camps.', bg: '#f0fdf4', border: '#16a34a', titleColor: '#166534', copyColor: '#15803d' },
  { icon: '🤝', title: 'Transparent Aid', copy: 'Direct tracking of every rupee donated.', bg: '#fef3c7', border: '#d97706', titleColor: '#92400e', copyColor: '#b45309' },
  { icon: '🛡️', title: 'Secure Process', copy: 'Encrypted & safe fund transfers.', bg: '#f3e8ff', border: '#9333ea', titleColor: '#6b21a8', copyColor: '#7e22ce' },
];

// `children` holds the donation form / certificate upload grid, which depends on Dashboard state.
export default function DonationCard({ text, expanded, onToggleForm, onNavigate, children }) {
  return (
    <section
      className={`nl-donation ${expanded ? "expanded" : ""}`}
      id="donation"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px', padding: '20px' }}
    >
      <h2 className="nl-donation-heading" style={{ textAlign: 'center', margin: 0 }}>❤️ {text.makeDonation}</h2>
      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', textAlign: 'center', margin: 0 }}>
        {text.donationCardCopy}
      </p>

      <div className="nl-donation-actions" style={{ justifyContent: 'center' }}>
        <button className="nl-blue-button" onClick={onToggleForm}>{text.donateNow} →</button>
        <button className="nl-blue-button secondary" onClick={() => onNavigate("donateInfo")}>{text.learnMore} →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid #edf2f7', paddingTop: '10px', textAlign: 'center' }}>
        <div style={statBox}>
          <div style={{ fontSize: '13px' }}>⚡</div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#174d82' }}>Quick Funds</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Disbursal</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '13px' }}>🏥</div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#174d82' }}>40,000+</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Patients Supported</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '13px' }}>🌍</div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#174d82' }}>2+ Lakh</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Lives Impacted</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
        {infoCards.map((card) => (
          <div
            key={card.title}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: card.bg, padding: '14px 16px', borderRadius: '8px', borderLeft: `4px solid ${card.border}` }}
          >
            <span style={{ fontSize: '22px' }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: card.titleColor }}>{card.title}</div>
              <div style={{ fontSize: '13px', color: card.copyColor, marginTop: '2px' }}>{card.copy}</div>
            </div>
          </div>
        ))}
      </div>

      {children}
    </section>
  );
}
