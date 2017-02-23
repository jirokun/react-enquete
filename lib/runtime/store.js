/* eslint-env browser */
import { createStore } from 'redux';
import Immutable, { Map } from 'immutable';
import reducer from './reducers';
import BranchDefinition from '../runtime/models/survey/BranchDefinition';
import FinisherDefinition from '../runtime/models/survey/FinisherDefinition';
import ChildConditionDefinition from '../runtime/models/survey/ChildConditionDefinition';
import ItemDefinition from '../runtime/models/survey/questions/ItemDefinition';
import ConditionDefinition from '../runtime/models/survey/ConditionDefinition';
import NodeDefinition from '../runtime/models/survey/NodeDefinition';
import PageDefinition from '../runtime/models/survey/PageDefinition';
import { findQuestionDefinitionClass } from '../runtime/models/survey/questions/QuestionDefinitions';
import RuntimeValue from '../runtime/models/runtime/RuntimeValue';
import Options from '../runtime/models/options/Options';
import SurveyDefinition from '../runtime/models/survey/SurveyDefinition';
import SurveyDesignerState from '../runtime/models/SurveyDesignerState';
import ViewSetting from '../runtime/models/view/ViewSetting';

const nextReducer = require('./reducers');

export function configureStore(initialState) {
  const store = createStore(reducer, initialState, window.devToolsExtension ? window.devToolsExtension() : undefined);
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      store.replaceReducer(nextReducer);
    });
  }

  return store;
}

/**
 * JSONをImmutableJS化する
 *
 * forTestにtrueを渡すとテストで使用しやすいように値を返す
 */
export function json2ImmutableState(json, forTest) {
  const surveyDesignerStateWrapper = forTest ? json : { wrapper: json };
  const parsedObj = Immutable.fromJS(surveyDesignerStateWrapper, (key, value) => {
    switch (key) {
      case 'wrapper':
        return new SurveyDesignerState(value);
      case 'answers':
        return new Map(value);
      case 'view':
        return new ViewSetting(value);
      case 'runtime':
        return new RuntimeValue(value);
      case 'options':
        return new Options(value);
      case 'survey':
        return new SurveyDefinition(value);
      case 'pages':
        return value.map(v => new PageDefinition(v)).toList();
      case 'questions':
        return value.map((v) => {
          const dataType = v.get('dataType');
          const Model = findQuestionDefinitionClass(dataType);
          if (!Model) throw new Error(`question dataType="${dataType}"に対応するクラスが見つかりません。`);
          return new Model(v);
        }).toList();
      case 'items':
        return value.map(v => new ItemDefinition(v)).toList();
      case 'branches':
        return value.map(v => new BranchDefinition(v)).toList();
      case 'finishers':
        return value.map(v => new FinisherDefinition(v)).toList();
      case 'conditions':
        return value.map(v => new ConditionDefinition(v)).toList();
      case 'childConditions':
        return value.map(v => new ChildConditionDefinition(v)).toList();
      case 'nodes':
        return value.map(v => new NodeDefinition(v)).toList();
      default:
        return value;
    }
  });
  return forTest ? parsedObj : parsedObj.get('wrapper');
}
