import { Record, List, Map } from 'immutable';
import { ANSWER_NOT_POSTED } from '../../../constants/states';

export const RuntimeValueRecord = Record({
  currentNodeId: null,                 // 現在表示中のnodeId
  nodeStack: List(),                   // ユーザのnode遷移を格納する
  answers: Map(),                      // ユーザの回答
  postAnswerStatus: ANSWER_NOT_POSTED, // 回答の提出状態
});

export default class RuntimeValue extends RuntimeValueRecord {
  getCurrentNodeId() {
    return this.get('currentNodeId');
  }

  getNodeStack() {
    return this.get('nodeStack');
  }

  getInputValues() {
    return this.get('answers');
  }

  getPostAnswerStatus() {
    return this.get('postAnswerStatus');
  }
}
