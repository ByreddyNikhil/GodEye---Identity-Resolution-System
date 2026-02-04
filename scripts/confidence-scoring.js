function calculateConfidence(conservative_confidence, exploratory_confidence, profileAgeInYears) {
  const conservative = conservative_confidence || 0;
  const exploratory = exploratory_confidence || 0;

  // Temporal decay factor: older accounts get reduced weight
  const agePenalty = profileAgeInYears > 3 ? 0.7 : 1.0;
  const adjustedConservative = conservative * agePenalty;
  const adjustedExploratory = exploratory * agePenalty;

  // Both models must agree above threshold for AUTO_MERGE
  const bothAgreeThreshold = 0.8;
  const finalScore = Math.min(adjustedConservative, adjustedExploratory);

  return {
    finalScore,
    conservativeScore: adjustedConservative,
    exploratoryScore: adjustedExploratory,
    decision:
      (adjustedConservative >= bothAgreeThreshold && adjustedExploratory >= bothAgreeThreshold) ? "AUTO_MERGE" :
      (adjustedConservative >= 0.6 || adjustedExploratory >= 0.6) ? "NEEDS_REVIEW" :
                                                                     "NO_MATCH"
  };
}

module.exports = { calculateConfidence };
