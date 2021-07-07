import * as supertest from "supertest";
// import '@babel/polyfill';            // support for async/await

import app from '../src/App';
import * as md5 from 'md5';
import { Course } from '../src/core/Course';
import { Student } from '../src/core/Student';

const request = supertest(app);

// jest.setTimeout(10000)

async function loginTeacher() {
	return request.get('/api/v1/login?email=teacher%2B3%40gmail.com&password=1234')
}

async function loginStudent() {
	return request.get('/api/v1/login?email=student%2B3%40gmail.com&password=1234')
}

async function insertNote(course: number, type: string, type_id: number, note: number) {
	return request.get('/api/v1/student/note?course=' + course.toString() + '&type=' + type + '&type_id=' + type_id.toString() + '&note=' + note.toString())
		.set('token', md5('student+3@gmail.com'));
}


describe('baseRoute', () => {

  it('should be text/plain', async () => {
    await request.get('/')
    .then(res => {
      expect(res.type).toEqual("text/plain")
    })
  });

});


describe('Login', () => {

  it('should Login teacher', async () => {
    await loginTeacher()
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.body.token).toBe(md5('teacher+3@gmail.com'))
      })
  })

	it('should Login student ', async () => {
		await loginStudent()
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.body.token).toBe(md5('student+3@gmail.com'))
    })
	});

  it('should add grade', async () => {
    await insertNote(1, "devoir", 3, 44.44)
		.then(async res => {
			expect(res.status).toBe(200);
			expect(res.type).toEqual("application/json");
		})
  })

	it('Login with invalid email', async () => {
		const res = await request.get('/api/v1/login?email=invalid%2B3%40gmail.com&password=1234')
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.error).toBe('Error: Email and password do not match a student or a teacher')
	})

	it('Login teacher V2', async () => {
		// console.log("Login teacher V2")
		const res = await request.get('/api/v2/login?email=teacher%2B3%40gmail.com&password=1234')
		expect(res.status).toBe(200);
		// console.log(res.body);
		expect(res.type).toEqual("application/json");
		expect(res.body.token).toBe(md5('teacher+3@gmail.com'))
	})

	it('Login student V2', async () => {
		const res = await request.get('/api/v2/login?email=student%2B3%40gmail.com&password=1234')
		expect(res.status).toBe(200);
		expect(res.type).toEqual("application/json");
		expect(res.body.token).toBe(md5('student+3@gmail.com'))
	})

	it('LoginV2 with invalid email', async () => {
		const res = await request.get('/api/v2/login?email=invalid%2B3%40gmail.com&password=1234')
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.error).toBe('Error: Email and password do not match a student or a teacher')
	})
});

describe('Teacher', () => {
	beforeEach(async () => {
		await loginTeacher()
	})

	describe('Get Courses', () => {

    it('should respond with successful call for courses with valid teacher token ', async () => {
      let result = [Course.fromId(3), Course.fromId(4)];
      const res = await request.get('/api/v1/courses')
        .set('token', md5('teacher+3@gmail.com'))
      expect(res.status).toBe(200);
      expect(res.type).toEqual("application/json");
      expect(res.body.data).toEqual(result);
    });

		it('should respond with error if call for courses with invalid teacher token ', async () => {
			const res = await request.get('/api/v1/courses')
			//.set('token',)
			expect(res.status).toBe(500);
			expect(res.type).toEqual("application/json");
			expect(res.body.error).toEqual("Error: Teacher token not found")
		});
	});

	describe('get Students', () => {
		it('should respond with successful call for students with valid teacher token ', async () => {
			let students_following_course_3_taught_by_teacher_3 = [Student.fromId(2), Student.fromId(6)];
			const res = await request.get('/api/v1/course/3/students')
				.set('token', md5('teacher+3@gmail.com'))
			expect(res.status).toBe(200);
			expect(res.type).toEqual("application/json");
			expect(res.body.data).toEqual(students_following_course_3_taught_by_teacher_3);
		});

		it('should respond with error if call for students with invalid teacher token ', async () => {
			const res = await request.get('/api/v1/course/3/students')
				.set('token', 'invalid_token')
			expect(res.status).toBe(500);
			expect(res.type).toEqual("application/json");
			expect(res.body.error).toEqual('Error: Teacher token not found')
		});

		it('should respond with error if teacher do not teach course', async () => {
			const res = await request.get('/api/v1/course/3/students')
				.set('token', md5('teacher+1@gmail.com'))
			expect(res.status).toBe(500);
			expect(res.type).toEqual("application/json");
			expect(res.body.error).toEqual('Error: This teacher do not give this course')
		});
  });
});

describe('Student notes', () => {
	
  it('should not crash if student has no grades', async () => {
    await loginStudent()
    await request.get('/api/v1/student/notes/')
      .set('token', md5('student+3@gmail.com'))
      .then(res => {
        expect(res.status).toBe(200);
      })
  });

	it('should respond with error if call for grades is done without authentification token', async () => {
    await loginStudent()
    await request.get('/api/v1/student/note?course=12&type=devoir&type_id=13&note=65.02')
    .then(res => {
      expect(res.status).toBe(500);
      expect(res.type).toEqual("application/json");
      expect(res.body.error).toEqual('Error: Student token not found')  
    })
	});

  it('should respond with successful call for notes', async () => {
    await request.get('/api/v1/notes/clear')
  		.set('token', md5('teacher+3@gmail.com'))
    .then(() => request.get('/api/v1/login?email=student%2B3%40gmail.com&password=1234'))
    .then(() => insertNote(1, "devoir", 2, 33.33))
    .then(() => insertNote(4, "devoir", 5, 66.66))
    .then((res) => {
      expect(res.status).toBe(200);
      return request.get('/api/v1/student/notes/')
        .set('token', md5('student+3@gmail.com'))
    })
    .then(res => {
      // console.log("fetched grades")
      expect(res.status).toBe(200);
      expect(res.type).toEqual("application/json");
      // console.log(JSON.stringify(res.body.data))
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toEqual({ course: 1, type: 'devoir', type_id: 2, note: 33.33 });
      expect(res.body.data[1]).toEqual({ course: 4, type: 'devoir', type_id: 5, note: 66.66 });
    })
  });


	it('should respond with error on call for notes with invalid authentification', async () => {
    await loginStudent()
		await insertNote(1, 'devoir', 2, 33.33)
		const res = await request.get('/api/v1/student/notes/')
			.set('token', md5('invalid@gmail.com'))
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.data).toEqual(undefined)
	});

});

describe('student courses', () => {

	beforeEach(async () => {
		await loginStudent()
	});

	it('should respond with all courses of a student', async () => {
		let expected_results = [Course.fromId(5), Course.fromId(6)];

		const res = await request.get('/api/v1/student/courses')
			.set('token', md5('student+3@gmail.com'))
		expect(res.status).toBe(200);
		expect(res.type).toEqual("application/json");
		expect(res.body.data).toEqual(expected_results);
	});

	it('responds fail if token is teacher', async () => {
		const res = await request.get('/api/v1/student/courses')
			.set('token', md5('teacher+3@gmail.com'))
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.error).toEqual('Error: Student token not found')
	});
});

describe('course notes', () => {
  beforeEach(async () => {
    await loginStudent()
      .then(() => insertNote(1, 'devoir', 2, 33.33))
      .then(() => insertNote(2, 'questionnaire', 5, 66.66))
      .then(() => insertNote(2, 'questionnaire', 7, 88.88))
      .then(() => loginTeacher())
  });

	it('should respond with all notes for a course', async () => {
		const res = await request.get('/api/v1/course/2/notes')
			.set('token', md5('teacher+3@gmail.com'))
		expect(res.status).toBe(200);
		expect(res.type).toEqual("application/json");
		let sortedData = res.body.data.sort((n1,n2) => n1.type_id - n2.type_id);
		expect(sortedData[0]).toEqual({ "course": 2, "student": 3, "note": 66.66, "type": "questionnaire", "type_id": 5 })
		expect(sortedData[1]).toEqual({ "course": 2, "student": 3, "note": 88.88, "type": "questionnaire", "type_id": 7 })
	});

	it('should respond with and error when trying to get notes for a course without authentification', async () => {
		const res = await request.get('/api/v1/course/2/notes')
			.set('token', '')
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.error).toEqual('Error: Teacher token not found')
	});
});

describe('test utility', () => {

	beforeEach(async () => {
		await loginStudent()
    .then(() => insertNote(1, 'devoir', 2, 33.33))
	});

	it('respond successfully when changing server latency', async () => {
		const res = await request.get('/api/v1/latency?value=1.1')
		expect(res.status).toBe(200);
		expect(res.type).toEqual("application/json");
		expect(res.body.data).toBe(1.1)
	});

	it('respond with error if trying to clear notes without login', async () => {
		const res = await request.get('/api/v1/notes/clear')
			.set('token', '')
		expect(res.status).toBe(500);
		expect(res.type).toEqual("application/json");
		expect(res.body.error).toEqual('Error: Teacher token not found')
	}, 10000);

	it('clear all notes', async () => {
		await loginTeacher()
    .then(() => request.get('/api/v1/notes/clear')
      .set('token', md5('teacher+3@gmail.com')))
    .then(async (res) => {
      expect(res.status).toBe(200);
      expect(res.type).toEqual("application/json");
      expect(res.body.data).toEqual(undefined);
    })

    const res2 = await request.get('/api/v1/course/1/notes')
      .set('token', md5('teacher+3@gmail.com'))
    expect(res2.status).toBe(200);
    expect(res2.type).toEqual("application/json");
    expect(res2.body.data.length).toBe(0)  

	});

	it('fail to set student note when teacher do not give course', async () => {
		await loginTeacher()
    .then(() => request.post('/api/v1/note?student_id=1&course_id=1&type=Question&type_id=1&note=99.99')
    .set('token', md5('teacher+3@gmail.com')))
    .then((res) => {
      expect(res.type).toEqual("application/json");
      expect(res.body.error).toEqual("Error: This teacher do not give this course")
      expect(res.status).toBe(500);  
    })		
	});


	it('fail to set student note when student do not follow course', async () => {
		await loginTeacher()
    .then(() => request.post('/api/v1/note?student_id=3&course_id=1&type=Question&type_id=1&note=99.99')
    .set('token', md5('teacher+1@gmail.com')))
    .then((res) => {
      expect(res.status).toBe(500);
      expect(res.type).toEqual("application/json");
      expect(res.body.error).toEqual("Error: This student to not follow this course")  
    })
	});

	it('set student note', async () => {
		await loginTeacher()
    .then(() =>  request.post('/api/v1/note?student_id=1&course_id=1&type=Question&type_id=1&note=99.99')
			.set('token', md5('teacher+1@gmail.com')))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.type).toEqual("application/json");  
    })
	});
});

