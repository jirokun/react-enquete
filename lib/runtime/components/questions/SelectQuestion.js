/* eslint-env browser */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as ItemVisibility from '../../../constants/ItemVisibility';
import QuestionDetail from '../parts/QuestionDetail';

/** 設問：単一選択肢(select) */
class SelectQuestion extends Component {
  createItem(item) {
    const { survey, runtime, options } = this.props;
    // RadioやCheckboxはclass=hiddenとしているが、selectの場合要素を消さないと選択を外すことができない
    // したがってCLASS_NAME_HIDDENの場合にはnullを返す
    if (!options.isVisibilityConditionDisabled() && item.calcVisibilityClassName(survey, runtime.getAnswers()) === ItemVisibility.CLASS_NAME_HIDDEN) {
      return null;
    }

    return <option key={`${item.getId()}-select-option`} value={item.getIndex() + 1}>{item.getPlainLabel()}</option>;
  }

  render() {
    const { survey, replacer, question, options } = this.props;
    const title = question.getTitle();
    const description = question.getDescription();
    const answers = {};
    const name = question.getOutputName();

    return (
      <div className="SelectQuestion">
        <h2 className="question-title" data-dev-id-label={question.getDevId()} dangerouslySetInnerHTML={{ __html: replacer.id2Span(title, answers) }} />
        <h3 className="question-description" dangerouslySetInnerHTML={{ __html: replacer.id2Span(description, answers) }} />
        <div className="question">
          <select
            name={name}
            id={name}
            data-output-no={survey.findOutputNoFromName(name)}
            data-parsley-required
          >
            <option value="" />
            {question.getItems().map(item => this.createItem(item))}
          </select>
        </div>
        { options.isShowDetail() ? <QuestionDetail question={question} /> : null }
      </div>
    );
  }
}

const stateToProps = state => ({
  survey: state.getSurvey(),
  runtime: state.getRuntime(),
  view: state.getViewSetting(),
  options: state.getOptions(),
});

export default connect(
  stateToProps,
)(SelectQuestion);
