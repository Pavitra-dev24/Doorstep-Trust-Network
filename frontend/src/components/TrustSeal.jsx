const TIER_SHORT = {
  New: "NEW",
  "Building Trust": "BUILDING",
  Verified: "VERIFIED",
  "Highly Trusted": "TRUSTED",
};

function slug(tier) {
  return tier.replace(/\s+/g, "");
}

/**
 * A rubber-stamp-style seal: the report's design brief calls for an
 * explainable trust score rather than a black-box number, so the seal
 * always renders the tier name and the underlying vouch count together,
 * never just a bare score.
 */
export default function TrustSeal({ tier, vouchCount, size = 120 }) {
  const label = TIER_SHORT[tier] || tier.toUpperCase();
  const id = `seal-${slug(tier)}`;

  return (
    <svg
      className={`seal-tier-${slug(tier)}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Trust seal: ${tier}, ${vouchCount} vouch${vouchCount === 1 ? "" : "es"}`}
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="var(--seal-color)"
        strokeWidth="2"
        strokeDasharray="3 4"
        opacity="0.7"
      />
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="var(--seal-color)"
        strokeWidth="3"
      />
      <path
        id={id}
        d="M 60 60 m -34 0 a 34 34 0 1 1 68 0"
        fill="none"
      />
      <text fontSize="8.5" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="1.5" fill="var(--seal-color)">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          DOORSTEP · VERIFIED
        </textPath>
      </text>
      <text
        x="60"
        y="55"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="15"
        fill="var(--chalk-100)"
      >
        {label}
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--seal-color)"
      >
        {vouchCount} vouch{vouchCount === 1 ? "" : "es"}
      </text>
    </svg>
  );
}
