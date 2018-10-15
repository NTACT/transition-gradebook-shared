const convertGradeToGpa = require('./convertGradeToGpa');
const getGpaRange = require('./getGpaRange');
const normalizeGpa = require('./normalizeGpa');

const any = (...values) => values.some(v => !!v);
const gradeIs = (gradeLevel, ...grades) => {
  if(/age/.test(gradeLevel)) gradeLevel = 12; // Age grades are treated as 12th grade for risk calculations
  return grades.includes(+gradeLevel);
};

const riskCalculations = {
  absentPercent: (absentPercent, gradeLevel) => ({
    ultra: any(
      absentPercent >= 20 && gradeIs(gradeLevel, 6, 7, 8),
      absentPercent >= 30 && gradeIs(gradeLevel, 9, 10, 11, 12),
    ),
    high: absentPercent > 9,
    medium: absentPercent > 5,
    low: absentPercent <= 5,
  }),

  behaviorMarks: (behaviorMarks, gradeLevel) => ({
    ultra: any(
      behaviorMarks > 4,
      behaviorMarks > 0 && gradeIs(gradeLevel, 6, 7),
    ),
    high: behaviorMarks >= 2 && behaviorMarks <= 4,
    medium: behaviorMarks === 1,
    low: behaviorMarks === 0,
  }),

  suspended: (suspended) => ({
    ultra: suspended,
    high: false,
    medium: false,
    low: !suspended,
  }),

  gpa: (gpa) => ({
    ultra: gpa < 2,
    high: gpa < 2.5,
    medium: gpa < 3,
    low: gpa >= 3,
  }),

  failingEnglish: (failingEnglish, gradeLevel) => ({
    ultra: failingEnglish && gradeIs(gradeLevel, 6, 7, 8),
    high: false,
    medium: failingEnglish,
    low: !failingEnglish,
  }),

  failingMath: (failingMath, gradeLevel) => ({
    ultra: failingMath && gradeIs(gradeLevel, 6, 7, 8),
    high: false,
    medium: failingMath,
    low: !failingMath,
  }),

  failingOther: (failingOther) => ({
    ultra: false,
    high: false,
    medium: failingOther,
    low: !failingOther,
  }),

  onTrack: (onTrack, gradeLevel) => ({
    ultra: !onTrack && gradeIs(gradeLevel, 9, 10, 11, 12),
    high: false,
    medium: !onTrack,
    low: onTrack,
  }),

  retained: (retained, gradeLevel) => ({
    ultra: retained && gradeIs(gradeLevel, 9),
    high: false,
    medium: retained,
    low: !retained,
  }),

  schoolsAttended: (schoolsAttended) => ({
    ultra: false,
    high: schoolsAttended > 5,
    medium: schoolsAttended > 3 && schoolsAttended <= 5,
    low: schoolsAttended >= 1 && schoolsAttended <= 3,
  }),

  hasExtracurricular: (hasExtracurricular) => ({
    ultra: false,
    high: false,
    medium: !hasExtracurricular,
    low: hasExtracurricular,
  }),
};

function calcGpa(schoolSettings, studentTermInfo) {
  const { grade, gradeType } = studentTermInfo;
  if(grade == null || gradeType == null) return null;

  const gpaRange = getGpaRange(schoolSettings);
  const rawGpa = convertGradeToGpa(schoolSettings, gradeType, grade);
  return normalizeGpa(gpaRange, rawGpa);
}

function calculateRiskLevelsForKey(key, value, gradeLevel) {
  if(value == null) return 'No Data';
  const riskLevels = riskCalculations[key](value, gradeLevel);
  if(riskLevels.ultra) return 'ultra';
  if(riskLevels.high) return 'high';
  if(riskLevels.medium) return 'medium';
  return 'low';
}

function calcInterventions(studentTermInfo, gpa) {
  const {
    absentPercent,
    behaviorMarks,
    suspended,
    schoolsAttended,
    onTrack,
    failingEnglish,
    failingMath,
    failingOther,
  } = studentTermInfo;
  const attendance = absentPercent != null && absentPercent >= 6;

  const behavior = (
    (suspended != null && suspended) ||
    (behaviorMarks != null && behaviorMarks > 0)
  );

  const engagement = (
    attendance ||
    (schoolsAttended != null && schoolsAttended >= 4) ||
    (gpa != null && gpa < 2.5) ||
    onTrack === false ||
    failingEnglish ||
    failingMath ||
    failingOther
  );

  const english = failingEnglish;
  const math = failingMath;

  return { 
    attendance: !!attendance, 
    behavior: !!behavior, 
    engagement: !!engagement, 
    english: !!english,
    math: !!math,
  };
}

function calcOverallRisk(riskData) {
  const riskCategoryCounts = Object.values(riskData).reduce((counts, riskLevel) => {
    counts[riskLevel]++;
    return counts;
  }, {
    ultra: 0,
    high: 0,
    medium: 0,
    low: 0,
    'No Data': 0,
  });
  if(riskCategoryCounts.ultra > 0) return 'ultra';

  if(riskCategoryCounts.medium === 2) riskCategoryCounts.high++;

  if(riskCategoryCounts.high >= 2) return 'ultra';
  if(riskCategoryCounts.medium >= 3) return 'ultra';

  if(riskCategoryCounts.high > 0) return 'high';
  if(riskCategoryCounts.medium > 0) return 'medium';
  if(riskCategoryCounts.low > 0) return 'low';
  return 'No Data';
}

function calcTermInfoRiskData(schoolSettings, studentTermInfo) {
  const { gradeLevel } = studentTermInfo;
  const gpa = calcGpa(schoolSettings, studentTermInfo);

  const riskData = Object.keys(riskCalculations)
    .reduce((risks, key) => {
      const value = key === 'gpa' ? gpa : studentTermInfo[key];
      risks[key] = calculateRiskLevelsForKey(key, value, gradeLevel);
      return risks;
    }, {});

  const risk = calcOverallRisk(riskData);
  const interventions = calcInterventions(studentTermInfo, gpa);

  return {riskData, risk, interventions, studentTermInfo};
}

module.exports = {
  calcInterventions,
  calcOverallRisk,
  calcGpa,
  calcTermInfoRiskData,
  calculateRiskLevelsForKey,
};
