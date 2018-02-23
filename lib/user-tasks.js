const { ACTIONS, TASKS } = require('./consts');

function convertTaskToAction(task, userId, text) {
  console.log('convertTaskToAction', task);
  switch (task.type) {

    case TASKS.WAIT_ANSWER: {
      const { questionType } = task.options;

      switch (questionType) {
        case 'subscribe':
          return {
            action: ACTIONS.USER_COMMAND_SUBSCRIBE,
            userId: userId,
            courseId: text
          };
        case 'take_quiz': {
          return [
            {
              action: ACTIONS.USER_COMMAND_QUIZ,
              userId: userId,
              quizId: text
            }
          ];
        }
        case 'quiz':
          const { correctAnswer, note } = task.options;
          const userAnswer = text.trim().toLowerCase();

          if (userAnswer === correctAnswer) {
            return {
              action: ACTIONS.SEND_MESSAGE,
              userId: userId,
              type: 'learn',
              text: `👍`,
            };
          } else {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId: userId,
                type: 'learn',
                text: `👎`,
              },
              note && {
                action: ACTIONS.SEND_MESSAGE,
                userId: userId,
                type: 'learn',
                text: `${note}`,
              },
              {
                action: ACTIONS.SEND_MESSAGE,
                userId: userId,
                type: 'learn',
                text: `**${correctAnswer}**`,
              }
            ]
          }
        default:
          throw new Error(`Unknown command ${questionType}`);
      }
    }

    case TASKS.LEARN: {
      return {
        action: ACTIONS.SEND_MESSAGE,
        userId: userId,
        type: 'learn',
        text: `${task.options.text}`,
        buttons: [
          'Next'
        ]
      }
    }

    case TASKS.END_COURSE: {
      return {
        action: ACTIONS.MARK_COURSE_AS_FINISHED,
        userId,
        courseId: task.options.courseId
      };
    }

    case TASKS.QUIZ_QUESTION: {
      return [
        {
          action: ACTIONS.SEND_MESSAGE,
          userId: userId,
          type: 'learn',
          text: `${task.options.text}`,
        },
        {
          action: ACTIONS.ADD_TASKS_ON_TOP,
          userId: userId,
          tasks: [
            {
              type: TASKS.WAIT_ANSWER,
              options: {
                questionType: 'quiz',
                quizId: task.options.quizId,
                correctAnswer: task.options.answer,
                note: task.options.note,
              },
            }
          ]
        }
      ]
    }


    case TASKS.END_QUIZ: {
      return {
        action: ACTIONS.SEND_MESSAGE,
        userId,
        type: 'learn',
        text: `You have finished the quiz`,
      };
    }
  }
}

module.exports = {
  TASKS,
  convertTaskToAction
};
