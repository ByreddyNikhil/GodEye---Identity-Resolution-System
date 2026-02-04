// Test script for Confidence Fusion function
const testConfidenceFusion = (item) => {
  const det = item.det_confidence || 0;
  const llm = item.confidence || 0;
  const platformWeight = item.platform_weight || 0.5;
  const profileAgeInYears = item.profile_age_years || 0;
  const counterEvidence = item.counter_evidence || [];

  // Penalize confidence if counter-evidence exists
  const evidencePenalty = counterEvidence.length > 0 ? 0.8 : 1.0;
  const adjustedLLM = llm * evidencePenalty;

  // Temporal decay factor
  const agePenalty = profileAgeInYears > 3 ? 0.7 : 1.0;
  const adjustedLLMWithAge = adjustedLLM * agePenalty;

  const fusedLLM = adjustedLLMWithAge * platformWeight;
  const finalScore = Math.max(det, fusedLLM);

  return {
    finalScore,
    decision: finalScore >= 0.85 ? 'AUTO_MERGE' : finalScore >= 0.6 ? 'NEEDS_REVIEW' : 'NO_MATCH'
  };
};

// Test cases
console.log('Test 1: No counter-evidence, high confidence');
console.log(testConfidenceFusion({
  det_confidence: 0,
  confidence: 0.9,
  platform_weight: 0.5,
  profile_age_years: 2,
  counter_evidence: []
}));

console.log('\nTest 2: With counter-evidence, high confidence');
console.log(testConfidenceFusion({
  det_confidence: 0,
  confidence: 0.9,
  platform_weight: 0.5,
  profile_age_years: 2,
  counter_evidence: ['different activity periods']
}));

console.log('\nTest 3: Deterministic match');
console.log(testConfidenceFusion({
  det_confidence: 1,
  confidence: 0.5,
  platform_weight: 0.5,
  profile_age_years: 2,
  counter_evidence: []
}));

console.log('\nTest 4: Old profile with counter-evidence');
console.log(testConfidenceFusion({
  det_confidence: 0,
  confidence: 0.8,
  platform_weight: 0.5,
  profile_age_years: 5,
  counter_evidence: ['different usernames']
}));
