const enums = require('./enums');

const validTrueBooleans = ['true', 'yes', 'y', '1'];
const validFalseBooleans = ['false', 'no', 'n', '0'];
const validBooleans = [...validTrueBooleans, ...validFalseBooleans];

class YesNoBoolean {
    constructor(booleanValue) {
        if (typeof booleanValue !== 'boolean') {
            throw new Error('Illegal boolean value')
        }
        this.booleanValue = booleanValue;
    }

    getBooleanValue() {
        return this.booleanValue;
    }


    toString() {
        if (this.booleanValue) {
            return 'Yes';
        }
        return 'No';
    }

    static fromString(yesNoOrBoolean) {
        if (typeof yesNoOrBoolean === "undefined" || yesNoOrBoolean === null || yesNoOrBoolean.toString().trim().length === 0) {
            return null;
        }
        const stringValue = yesNoOrBoolean.toString().toLowerCase();
        if (validTrueBooleans.includes(stringValue)) {
            return new YesNoBoolean(true);
        }
        return new YesNoBoolean(false);
    }
}

const Yes = new YesNoBoolean(true);
const No = new YesNoBoolean(false);

function yesNoBooleanFromString(yesNoOrBoolean) {
    if (typeof yesNoOrBoolean === "undefined" || yesNoOrBoolean === null || yesNoOrBoolean.toString().trim().length === 0) {
        return null;
    }
    const stringValue = yesNoOrBoolean.toString().toLowerCase();
    if (validTrueBooleans.includes(stringValue)) {
        return Yes;
    }
    return No;
}

function normalizeFieldName(name) {
    return name
        .toLowerCase() // remove the cute uppercase letters
        .replace(/\s/g, ''); //remove the cute spaces in the fields
}

/**
 * Convert cute, human friendly field names to a common form that computers can understand
 * @param {Array} entry a single value returned by Object.entries 
 */
function normalizeFieldNames(entry) {
    const [key, value] = entry;
    return [
        normalizeFieldName(key),
        value
    ];
}



function isValidBoolean(boolean) {
    return yesNoBooleanFromString(boolean) !== null;
}

function toRealBooleanValue(booleanValue) {
    if (isValidBoolean(booleanValue)) {
        return yesNoBooleanFromString(booleanValue).getBooleanValue();
    }
    throw new Error(`${booleanValue} cannot be mapped to a true/false value`);
}

function toYesNoBooleanValue(booleanValue) {
    if (isValidBoolean(booleanValue)) {
        if (validTrueBooleans.includes(booleanValue.toString().toLowerCase())) {
            return 'Yes';
        }
        return 'No';
    }
    throw new Error(`${booleanValue} cannot be mapped to a yes/no value`);
}

function equalsIgnoreCase(str1, str2) {
    if (str1 === undefined || str1 === null) {
        return str1 === str2;
    }
    return str1.toString().toLowerCase() === str2.toString().toLowerCase();
}

const types = {
    integer: 'integer',
    string: 'string',
    date: 'date',
    float: 'float',
    boolean: 'boolean',
    enum: 'enum',
    array: 'array',
}

const studentIdColumn = {
    headerText: 'Id Number',
    validAlias: ['id number', 'student number', 'idNumber', 'id', 'studentNumber', 'student id'],
    required: true,
    field: 'studentId',
    type: types.string,
}

const validGradeTypes = {
    percent: ['percent', 'percentage'],
    letter: ['letter', 'letter grade'],
    gpa: ['gpa', 'gpa point']
}


const columns = [
    studentIdColumn,

    {
        headerText: 'First Name',
        validAlias: ['first name', 'firstName', 'first'],
        required: true,
        field: 'firstName',
        type: types.string,
    },

    {
        headerText: 'Last Name',
        validAlias: ['last name', 'lastName', 'last'],
        required: true,
        field: 'lastName',
        type: types.string,
    },

    {
        headerText: 'Gender',
        validAlias: ['gender', 'sex'],
        required: true,
        validValues: [...enums.genders, 'm', 'f', 't'],
        field: 'gender',
        type: types.enum,
        enumValues: enums.genders,
        deserialize: value => {
            if(value) {
                const lowercaseValue = value.toLowerCase();
                switch(lowercaseValue) {
                    case 'm':
                        return 'male';
                    case 'f': 
                        return 'female';
                    case 't':
                        return 'trans';
                    default:
                        return lowercaseValue;
                }
            }
            return '';
        }
    },

    {
        headerText: 'Grade/Age',
        validAlias: ['grade/age', 'age', 'grade level'],
        validValues: [...enums.grades].map(val => val.toString().toLowerCase()),
        enumValues: enums.grades,
        field: 'gradeLevel',
        type: types.enum,
        deserialize: value => {
            return enums.grades.find(grade => equalsIgnoreCase(grade, value))
        },
        required: true,
    },

    {
        headerText: 'Is Student ELL?',
        validAlias: ['ell', 'english language learner', 'Is Student ELL?'],
        validValues: validBooleans,
        required: true,
        field: 'ell',
        type: types.boolean,

    },

    {
        headerText: 'Date of Birth',
        validAlias: ['date of birth', 'birthday', 'dob'],
        required: true,
        field: 'birthday',
        type: types.date,
    },

    {
        headerText: 'Disability categories / 504',
        validAlias: ['disability categories / 504', 'disabilities'],
        type: types.array,
        field: 'disabilities',
        deserialize: value => {
            if (value) {
                return value.split(' ');
            }
            return [];
        }
    },

    {
        headerText: 'Has 504 Plan',
        validAlias: ['Has 504 Plan', '504 Plan', 'has504Plan', 'plan504'],
        type: types.boolean,
        field: 'plan504',
    },

    {
        headerText: 'Race',
        validAlias: ['race', 'ethnicity'],
        validValues: [...enums.races, ...Object.values(enums.raceLabels)],
        enumValues: Object.values(enums.raceLabels),
        field: 'race',
        required: true,
        type: types.enum,
        deserialize: value => {
            // Matches the "short" version of the race enum
            if (enums.raceLabels[value]) {
                return value;
            }

            for (const [key, enumValue] of Object.entries(enums.raceLabels)) {
                // Matches the labels
                if (equalsIgnoreCase(enumValue, value)) {
                    return key;
                }
            }

            // Not found
            return null;
        }
    },
    {
        headerText: 'Exit Category',
        validAlias: ['exitCategory'],
        field: 'exitCategory',
        validValues: enums.exitCategories,
        type: types.enum,
    },
    {
        headerText: 'Post-school outcomes',
        validAlias: ['post school outcome', 'post school outcomes', 'post-school outcomes'],
        field: 'postSchoolOutcome',
        validValues: enums.postSchoolOutcomes,
        type: types.enum,
    },
    {
        headerText: 'Post-school goals',
        validAlias: ['post school goals', 'post-school goals'],
        field: 'postSchoolGoals',
        type: types.string,
    },
    {
        headerText: 'Attended IEP meeting',
        validAlias: ['Attended IEP meeting', 'attendedIepMeeting'],
        validValues: validBooleans,
        field: 'attendedIepMeeting',
        type: types.boolean
    },
    {
        headerText: 'IEP role',
        validAlias: ['iep role'],
        validValues: enums.iepRoles,
        field: 'iepRole',
        type: types.enum,
    },
    {
        headerText: 'Career development or graduation plan',
        validAlias: ['hasgraduationplan', 'Career development or graduation plan'],
        validValues: validBooleans,
        field: 'hasGraduationPlan',
        type: types.boolean
    },
    {
        headerText: 'Grade type',
        validAlias: ['gradetype'],
        // Matches values on the UI
        validValues: [...enums.gradeTypes, 'percentage', 'letter grade', 'gpa point'],
        enumValues: enums.gradeTypes,
        field: 'gradeType',
        type: types.enum,
        deserialize: value => {
            if(!value) return '';
            const lowercaseValue = value.toLowerCase();
            for(const key in validGradeTypes) {
                if(validGradeTypes[key].includes(lowercaseValue)) {
                    return key;
                }
            }
            return value;
        },
    },
    {
        headerText: 'Grade',
        validAlias: ['grade', ...enums.gradeTypes, 'percentage', 'letter grade', 'gpa point'],
        field: 'grade',
    },
    {
        headerText: '% of school time absent (excused or not)',
        validAlias: ['% of school time absent (excused or not)', 'absentPercent'],
        field: 'absentPercent',
        type: types.float,
    },
    {
        headerText: '# of behavior marks/office referrals',
        validAlias: ['# of behavior marks/office referrals', 'behaviorMarks'],
        field: 'behaviorMarks',
        type: types.integer,
    },
    {
        headerText: 'Was student suspended?',
        validAlias: ['Was student suspended?', 'suspended'],
        validValues: validBooleans,
        field: 'suspended',
        type: types.boolean,
    },
    {
        headerText: 'Did student fail English/ELA?',
        validAlias: ['Did student fail English/ELA?', 'failingEnglish'],
        validValues: validBooleans,
        field: 'failingEnglish',
        type: types.boolean,
    },
    {
        headerText: 'Did student fail Math?',
        validAlias: ['Did student fail Math?', 'failingMath'],
        validValues: validBooleans,
        field: 'failingMath',
        type: types.boolean,
    },
    {
        headerText: 'Did student fail any other class?',
        validAlias: ['Did student fail any other class?', 'failingOther'],
        validValues: validBooleans,
        field: 'failingOther',
        type: types.boolean,
    },
    {
        headerText: 'On-track (enough credits) for grade?',
        validAlias: ['On-track (enough credits) for grade?', 'onTrack'],
        validValues: validBooleans,
        field: 'onTrack',
        type: types.boolean,
    },
    {
        headerText: 'Retained one or more years?',
        validAlias: ['Retained one or more years?', 'retained'],
        validValues: validBooleans,
        field: 'retained',
        type: types.boolean,
    },
    {
        headerText: '# of schools enrolled in through present',
        validAlias: ['# of schools enrolled in through present', 'schoolsAttended'],
        field: 'schoolsAttended',
        type: types.integer,
    },
    {
        headerText: 'Any extracurricular activities?',
        validAlias: ['Any extracurricular activities?', 'hasExtracurricular'],
        validValues: validBooleans,
        field: 'hasExtracurricular',
        type: types.boolean,
    },
    {
        headerText: 'Self-determination / self-advocacy skills',
        validAlias: ['Self-determination / self-advocacy skills', 'hasSelfDeterminationSkills', 'Self-determination skills'],
        validValues: validBooleans,
        field: 'hasSelfDeterminationSkills',
        type: types.boolean,
    },
    {
        headerText: 'Independent living skills',
        validAlias: ['Independent living skills', 'hasIndependentLivingSkills'],
        validValues: validBooleans,
        field: 'hasIndependentLivingSkills',
        type: types.boolean,
    },
    {
        headerText: 'Travel skills',
        validAlias: ['Travel skills', 'hasTravelSkills'],
        validValues: validBooleans,
        field: 'hasTravelSkills',
        type: types.boolean,
    },
    {
        headerText: 'Social Skills',
        validAlias: ['Social Skills', 'hasSocialSkills'],
        validValues: validBooleans,
        field: 'hasSocialSkills',
        type: types.boolean,
    }
]

const [requiredFields, optionalFields] = (() => {
    const required = [];
    const optional = [];
    columns.forEach(col => {
        const { validAlias, ...rest } = col;
        const value = {
            ...rest,
            validAlias: validAlias.map(normalizeFieldName)
        }
        if (col.required) {
            required.push(value);
        } else {
            optional.push(value)
        }
    });
    return [required, optional];
})();


module.exports = {
    columns,
    requiredFields,
    optionalFields,
    normalizeFieldNames,
    normalizeFieldName,
    types,
    isValidBoolean,
    toRealBooleanValue,
    toYesNoBooleanValue,
    equalsIgnoreCase,
    Yes,
    No,
    yesNoBooleanFromString,
}