
// Takes a GPA min/max and GPA value and converts the GPA into the 0.0 - 4.0 range
module.exports = function normalizeGpa(gpaRange, gpa) {
  const [min, max] = gpaRange;
  return 4 * (gpa - min) / (max - min);
};
