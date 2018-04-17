const { messageToCategory } = require('./user-message-parser');
const { ACTIONS, CONTEXTS, MESSAGE_CATEGORIES } = require('./consts');

function messageToAction(text = '', userId, context = {}) {
  const contextData = context.contextData || {};
  const contextType = contextData.type || '';
  const buttons = (context.contextButtons || []).filter(b => b !== text);

  const categoryData = messageToCategory(text) || {};
  const category = categoryData.category || 'UNKNOWN';

  switch (category) {
    case MESSAGE_CATEGORIES.DEFINITION:
      return {
        action: ACTIONS.RESPOND_WITH_DEFINITION,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.IMAGE:
      return {
        action: ACTIONS.RESPOND_WITH_IMAGE,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.AUDIO:
      return {
        action: ACTIONS.RESPOND_WITH_AUDIO,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.SYNONYMS:
      return {
        action: ACTIONS.RESPOND_WITH_SYNONYMS,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.EXAMPLE:
      return {
        action: ACTIONS.RESPOND_WITH_EXAMPLES,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.IPA:
      return {
        action: ACTIONS.RESPOND_WITH_IPA,
        userId,
        text: categoryData.text || contextData.entity,
        raw: contextType === CONTEXTS.QUIZ
      };
    case MESSAGE_CATEGORIES.TRANSLATE:
      return {
        action: ACTIONS.RESPOND_WITH_TRANSLATION,
        userId,
        text: categoryData.text || contextData.entity,
      };
    case MESSAGE_CATEGORIES.SKIP:
      return {
        action: ACTIONS.SKIP_WAITING,
        userId,
      };
    case MESSAGE_CATEGORIES.COURSES:
      return {
        action: ACTIONS.RESPOND_WITH_COURSES,
        userId,
      };
    case MESSAGE_CATEGORIES.QUIZ:
      return {
        action: ACTIONS.USER_COMMAND_QUIZ,
        userId,
        quizId: categoryData.text,
      };
    case MESSAGE_CATEGORIES.QUIZZES:
      return {
        action: ACTIONS.RESPOND_WITH_QUIZZES,
        userId,
        quizId: categoryData.text,
      };
    case MESSAGE_CATEGORIES.SUBSCRIPTION:
      return {
        action: ACTIONS.RESPOND_WITH_SUBSCRIPTIONS,
        userId,
      };
    case MESSAGE_CATEGORIES.SUBSCRIBE:
      return {
        action: ACTIONS.USER_COMMAND_SUBSCRIBE,
        userId,
        courseId: categoryData.text,
      };
    case MESSAGE_CATEGORIES.PING:
      return {
        action: ACTIONS.RESPOND_WITH_PONG,
        userId,
      };
    case MESSAGE_CATEGORIES.HI:
      return {
        action: ACTIONS.RESPOND_WITH_HI,
        userId,
      };
    case MESSAGE_CATEGORIES.STOP:
      return {
        action: ACTIONS.USER_COMMAND_STOP,
        userId,
        text: categoryData.text,
      };
    case MESSAGE_CATEGORIES.MORE: {
      return [
        {
          action: ACTIONS.SEND_MESSAGE,
          userId,
          text: contextData.more,
        },
        {
          action: ACTIONS.SKIP_WAITING,
          userId,
        },
      ];
    }
    case 'UNKNOWN': {
      switch (contextType) {
        case CONTEXTS.QUIZ: {
          return [
            {
              action: ACTIONS.RESPOND_WITH_QUIZ_ANSWER,
              userId,
              text,
              contextData,
              buttons,
            },
            {
              action: ACTIONS.SKIP_WAITING,
              userId,
            },
          ];
        }
        case CONTEXTS.SUBSCRIBE: {
          const index = parseInt(text) - 1;

          return [
            {
              action: ACTIONS.USER_COMMAND_SUBSCRIBE,
              userId,
              courseId: contextData.courses[index],
            },
            {
              action: ACTIONS.SKIP_WAITING,
              userId,
            },
          ];
        }
        case CONTEXTS.TAKE_QUIZ: {
          const index = parseInt(text) - 1;

          return [
            {
              action: ACTIONS.USER_COMMAND_QUIZ,
              userId,
              quizId: contextData.quizzes[index],
            },
            {
              action: ACTIONS.SKIP_WAITING,
              userId,
            },
          ];
        }
      }

      return {
        action: ACTIONS.RESPOND_WITH_NOT_FOUND,
        userId,
      };
    }
  }
}

module.exports = {
  messageToAction,
};
