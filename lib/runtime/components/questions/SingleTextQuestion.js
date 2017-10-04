/* eslint-env browser */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/** 設問：1行テキスト */
class SingleTextQuestion extends Component {
  render() {
    const { survey, replacer, question } = this.props;
    const title = question.getTitle();
    const description = question.getDescription();
    const name = question.getOutputName();

    return (
      <div className="SingleTextQuestion">
        <h2 className="question-title" data-dev-id-label={question.getDevId()} dangerouslySetInnerHTML={{ __html: replacer.id2Span(title) }} />
        <h3 className="question-description" dangerouslySetInnerHTML={{ __html: replacer.id2Span(description) }} />
        <div className="question">
          <input
            type="text"
            name={name}
            id={name}
            data-output-no={survey.findOutputNoFromName(name)}
            data-response-key="value"
            data-response-multiple={false}
            data-parsley-required
            data-parsley-maxlength="20"
          />
          <p>※20文字まで</p>
        </div>
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
)(SingleTextQuestion);
