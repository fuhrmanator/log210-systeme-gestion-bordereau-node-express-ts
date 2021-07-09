import * as supertest from 'supertest';

import app from '../src/App';
import * as md5 from 'md5';
import { Course } from '../src/core/Course';
import { Student } from '../src/core/Student';

const request = supertest(app);

const TEACHER_3_EMAIL = 'teacher+3@gmail.com';
const TEACHER_3_PASSWORD = '1234';
const TEACHER_1_EMAIL = 'teacher+1@gmail.com';
const STUDENT_3_EMAIL = 'student+3@gmail.com';
const STUDENT_3_PASSWORD = '1234';
const TEACHER_LOGIN_URI_WITH_CREDENTIALS_V1 = '/api/v1/login?email=' + encodeURIComponent(TEACHER_3_EMAIL) + '&password=' + encodeURIComponent(TEACHER_3_PASSWORD);
const TEACHER_LOGIN_URI_WITH_CREDENTIALS_V2 = '/api/v2/login?email=' + encodeURIComponent(TEACHER_3_EMAIL) + '&password=' + encodeURIComponent(TEACHER_3_PASSWORD);
const STUDENT_LOGIN_URI_WITH_CREDENTIALS_V1 = '/api/v1/login?email=' + encodeURIComponent(STUDENT_3_EMAIL) + '&password=' + encodeURIComponent(STUDENT_3_PASSWORD);
const STUDENT_LOGIN_URI_WITH_CREDENTIALS_V2 = '/api/v2/login?email=' + encodeURIComponent(STUDENT_3_EMAIL) + '&password=' + encodeURIComponent(STUDENT_3_PASSWORD);

async function loginTeacher() {
	return request.get(TEACHER_LOGIN_URI_WITH_CREDENTIALS_V1)
}

async function loginStudent() {
	return request.get(STUDENT_LOGIN_URI_WITH_CREDENTIALS_V1)
}

async function insertNote(course: number, type: string, type_id: number, note: number) {
	return request.get('/api/v1/student/note?course=' + course.toString() + '&type=' + type + '&type_id=' + type_id.toString() + '&note=' + note.toString())
		.set('token', md5(STUDENT_3_EMAIL));
}


describe('baseRoute', () => {

	it('should be text/plain', async () => {
		const res = await request.get('/');
		expect(res.type).toBe('text/plain')
	});

});


describe('Login', () => {

	it('should Login teacher', async () => {
		const res = await loginTeacher()
		expect(res.statusCode).toBe(200);
		expect(res.body.token).toBe(md5(TEACHER_3_EMAIL))
	})

	it('should Login student ', async () => {
		const res = await loginStudent()
		expect(res.statusCode).toBe(200)
		expect(res.body.token).toBe(md5(STUDENT_3_EMAIL))
	});

	it('should add grade', async () => {
		const res = await insertNote(1, "devoir", 3, 44.44)
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
	})

	it('should fail login with invalid email', async () => {
		const res = await request.get('/api/v1/login?email=invalid%2B3%40gmail.com&password=1234')
		expect(res.statusCode).toBe(500)
		expect(res.type).toBe('application/json')
		expect(res.body.error).toBe('Error: Email and password do not match a student or a teacher')
	})

	it('should login teacher V2', async () => {
		const res = await request.get(TEACHER_LOGIN_URI_WITH_CREDENTIALS_V2)
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
		expect(res.body.token).toBe(md5(TEACHER_3_EMAIL))
	})

	it('should login student V2', async () => {
		const res = await request.get(STUDENT_LOGIN_URI_WITH_CREDENTIALS_V2)
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
		expect(res.body.token).toBe(md5(STUDENT_3_EMAIL))
	})

	it('should fail login V2 with invalid email', async () => {
		const res = await request.get('/api/v2/login?email=invalid%2B3%40gmail.com&password=1234')
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.error).toBe('Error: Email and password do not match a student or a teacher')
	})
});

describe('Teacher', () => {
	beforeEach(async () => {
		const res = await loginTeacher()
		expect(res.statusCode).toBe(200)
	})

	describe('Get Courses', () => {

		it('should respond with successful call for courses with valid teacher token ', async () => {
			let result = [Course.fromId(3), Course.fromId(4)];
			const res = await request.get('/api/v1/courses')
				.set('token', md5(TEACHER_3_EMAIL))
			expect(res.statusCode).toBe(200);
			expect(res.type).toBe('application/json');
			expect(res.body.data).toEqual(result);
		});

		it('should respond with error if call for courses with invalid teacher token ', async () => {
			const res = await request.get('/api/v1/courses')
			expect(res.statusCode).toBe(500);
			expect(res.type).toBe('application/json');
			expect(res.body.error).toEqual("Error: Teacher token not found")
		});
	});

	describe('get Students', () => {
		it('should respond with successful call for students with valid teacher token ', async () => {
			const studentsFollowingCourse3TaughtByTeacher3 = [Student.fromId(2), Student.fromId(6)];
			const res = await request.get('/api/v1/course/3/students')
				.set('token', md5(TEACHER_3_EMAIL))
			expect(res.statusCode).toBe(200);
			expect(res.type).toBe('application/json');
			expect(res.body.data).toEqual(studentsFollowingCourse3TaughtByTeacher3);
		});

		it('should respond with error if call for students with invalid teacher token ', async () => {
			const res = await request.get('/api/v1/course/3/students')
				.set('token', md5('invalid_token'))
			expect(res.statusCode).toBe(500);
			expect(res.type).toBe('application/json');
			expect(res.body.error).toEqual('Error: Teacher token not found')
		});

		it('should respond with error if teacher does not teach course', async () => {
			const res = await request.get('/api/v1/course/3/students')
				.set('token', md5(TEACHER_1_EMAIL))
			expect(res.statusCode).toBe(500)
			expect(res.type).toBe('application/json')
			expect(res.body.error).toEqual('Error: This teacher do not give this course')
		});
	});
});

describe('Student notes', () => {

	it('should not crash if student has no grades', async () => {
		const loginResult = await loginStudent()
		expect(loginResult.statusCode).toBe(200)
		const res = await request.get('/api/v1/student/notes/')
			.set('token', md5(STUDENT_3_EMAIL))
		expect(res.statusCode).toBe(200);
	});

	it('should respond with error if call for grades is done without authentification token', async () => {
		const loginResult = await loginStudent()
		expect(loginResult.statusCode).toBe(200)
		const res = await request.get('/api/v1/student/note?course=12&type=devoir&type_id=13&note=65.02');
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.error).toEqual('Error: Student token not found')
	});

	it('should respond with successful call for two grades', async () => {
		// clear grades first
		const clearResult = await request.get('/api/v1/notes/clear')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(clearResult.statusCode).toEqual(200)
		const studentLoginResult = await loginStudent()
		expect(studentLoginResult.statusCode).toEqual(200)
		const insert1Result = await insertNote(1, "devoir", 2, 33.33)
		expect(insert1Result.statusCode).toEqual(200)
		const insert2Result = await insertNote(4, "devoir", 5, 66.66)
		expect(insert2Result.statusCode).toEqual(200)

		const getGradesResult = await request.get('/api/v1/student/notes/')
			.set('token', md5(STUDENT_3_EMAIL))
		expect(getGradesResult.status).toBe(200)
		expect(getGradesResult.type).toBe('application/json');
		expect(getGradesResult.body.data.length).toBe(2);
		expect(getGradesResult.body.data[0]).toEqual({ course: 1, type: 'devoir', type_id: 2, note: 33.33 });
		expect(getGradesResult.body.data[1]).toEqual({ course: 4, type: 'devoir', type_id: 5, note: 66.66 });
	})


	it('should respond with error on call for notes with invalid authentification', async () => {
		const studentLoginResult = await loginStudent()
		expect(studentLoginResult.statusCode).toBe(200)
		const insertResult = await insertNote(1, 'devoir', 2, 33.33)
		expect(insertResult.statusCode).toBe(200)
		const res = await request.get('/api/v1/student/notes/')
			.set('token', md5('invalid@gmail.com'))
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.data).toEqual(undefined)
	});

});

describe('student courses', () => {

	beforeEach(async () => {
		const loginResult = await loginStudent()
		expect(loginResult.statusCode).toBe(200)
	});

	it('should respond with all courses of a student', async () => {
		let expected_results = [Course.fromId(5), Course.fromId(6)];

		const res = await request.get('/api/v1/student/courses')
			.set('token', md5(STUDENT_3_EMAIL))
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
		expect(res.body.data).toEqual(expected_results);
	});

	it('should respond with fail if token is teacher', async () => {
		const res = await request.get('/api/v1/student/courses')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.error).toEqual('Error: Student token not found')
	});
});

describe('course grades', () => {
	beforeEach(async () => {
		const loginSResult = await loginStudent()
		expect(loginSResult.statusCode).toBe(200)
		const insert1Result = await insertNote(1, 'devoir', 2, 33.33)
		expect(insert1Result.statusCode).toBe(200)
		const insert2Result = await insertNote(2, 'questionnaire', 5, 66.66)
		expect(insert2Result.statusCode).toBe(200)
		const insert3Result = await insertNote(2, 'questionnaire', 7, 88.88)
		expect(insert3Result.statusCode).toBe(200)
		const loginTResult = await loginTeacher();
		expect(loginTResult.statusCode).toBe(200)
	});

	it('should respond with all notes for a course', async () => {
		const res = await request.get('/api/v1/course/2/notes')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
		const sortedData = res.body.data.sort((n1, n2) => n1.type_id - n2.type_id);
		expect(sortedData[0]).toEqual({ "course": 2, "student": 3, "note": 66.66, "type": "questionnaire", "type_id": 5 })
		expect(sortedData[1]).toEqual({ "course": 2, "student": 3, "note": 88.88, "type": "questionnaire", "type_id": 7 })
	});

	it('should respond with and error when trying to get notes for a course without authentification', async () => {
		const res = await request.get('/api/v1/course/2/notes')
			.set('token', '')
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.error).toEqual('Error: Teacher token not found')
	});
});

describe('utilities', () => {

	beforeEach(async () => {
		const loginResult = await loginStudent()
		expect(loginResult.statusCode).toBe(200)
		const insertResult = await insertNote(1, 'devoir', 2, 33.33)
		expect(insertResult.statusCode).toBe(200)
	});

	it('should respond successfully when changing server latency', async () => {
		const res = await request.get('/api/v1/latency?value=1.1')
		expect(res.statusCode).toBe(200);
		expect(res.type).toBe('application/json');
		expect(res.body.data).toBe(1.1)
	});

	it('should respond with error if trying to clear notes without login', async () => {
		const res = await request.get('/api/v1/notes/clear')
			.set('token', '')
		expect(res.statusCode).toBe(500);
		expect(res.type).toBe('application/json');
		expect(res.body.error).toEqual('Error: Teacher token not found')
	}, 10000);

	it('should clear all grades', async () => {
		const loginResult = await loginTeacher()
		expect(loginResult.statusCode).toBe(200)
		const clearResult = await request.get('/api/v1/notes/clear')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(clearResult.statusCode).toBe(200)
		expect(clearResult.type).toBe('application/json');
		expect(clearResult.body.data).toBe(undefined);

		const gradesResult = await request.get('/api/v1/course/1/notes')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(gradesResult.status).toBe(200);
		expect(gradesResult.type).toBe('application/json');
		expect(gradesResult.body.data.length).toBe(0)
	});

	it('should fail to set student grade when teacher does not teach course', async () => {
		const loginResult = await loginTeacher();
		expect(loginResult.statusCode).toBe(200)
		const gradesResult = await request.post('/api/v1/note?student_id=1&course_id=1&type=Question&type_id=1&note=99.99')
			.set('token', md5(TEACHER_3_EMAIL))
		expect(gradesResult.type).toBe('application/json');
		expect(gradesResult.body.error).toEqual("Error: This teacher does not teach this course")
		expect(gradesResult.statusCode).toBe(500);
	});


	it('should fail to set student note when student is not enrolled in course', async () => {
		const loginResult = await loginTeacher()
		expect(loginResult.statusCode).toBe(200)
		const gradesResult = await request.post('/api/v1/note?student_id=3&course_id=1&type=Question&type_id=1&note=99.99')
			.set('token', md5(TEACHER_1_EMAIL))
		expect(gradesResult.statusCode).toBe(500)
		expect(gradesResult.type).toBe('application/json')
		expect(gradesResult.body.error).toEqual("Error: This student is not enrolled in this course")
	});

	it('should set student grade', async () => {
		const loginResult = await loginTeacher()
		expect(loginResult.statusCode).toBe(200)
		const gradesResult = await request.post('/api/v1/note?student_id=1&course_id=1&type=Question&type_id=1&note=99.99')
			.set('token', md5(TEACHER_1_EMAIL))
		expect(gradesResult.statusCode).toBe(200);
		expect(gradesResult.type).toBe('application/json');
	});
});

