/* eslint-env browser */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/** 設問：複数行テキスト */
class TextQuestion extends Component {
  render() {
    const { survey, replacer, question } = this.props;
    const title = question.getTitle();
    const description = question.getDescription();
    const answers = {};
    const name = question.getOutputName();

    return (
      <div className="TextQuestion">
        <h2 className="question-title" data-dev-id-label={question.getDevId()} dangerouslySetInnerHTML={{ __html: replacer.id2Span(title, answers) }} />
        <h3 className="question-description" dangerouslySetInnerHTML={{ __html: replacer.id2Span(description, answers) }} />
        <div className="question">
          <textarea
            name={name}
            id={name}
            className="freetext"
            rows="6"
            cols="40"
            data-output-no={survey.findOutputNoFromName(name)}
            data-response-key="value"
            data-response-multiple={false}
            data-parsley-required
          />
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
)(TextQuestion);
