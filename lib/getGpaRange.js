module.exports = function getGpaRange(schoolSettings) {
  const gpas = schoolSettings.gradeConversions.map(c => c.gpa);
  return [Math.min(...gpas), Math.max(...gpas)];
}
