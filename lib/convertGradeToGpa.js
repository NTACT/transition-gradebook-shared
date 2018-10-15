
module.exports = function convertGradeToGpa(schoolSettings, gradeType, grade) {
  if(gradeType === 'gpa') {
    return +grade;
  }
  if(gradeType === 'percent') {
    grade = +grade;
    const gradeConversions = schoolSettings.gradeConversions.sort((a, b) => b.percent - a.percent);
    return (gradeConversions.find(row => row.percent <= grade) || last(gradeConversions)).gpa;
  }
  if(gradeType === 'letter') {
    const row = schoolSettings.gradeConversions.find(row => row.letter === grade);
    if(!row) throw new Error(`Invalid grade letter ${grade}`);
    return row.gpa;
  }
  throw new Error(`Invalid grade type ${gradeType}`);
};

function last(array) {
  return array[array.length - 1];
}
