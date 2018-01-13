// Multi-line input

import React from 'react';

import Color from 'color';
import styled from 'styled-components';

import ChevronRight from 'react-icons/lib/md/chevron-right';
import theme from 'common/theme'; // TODO: what's this theme for?

import MonacoEditor from 'app/components/sandbox/CodeEditor/monaco/MonacoReactComponent';

import { IconContainer } from './styles';

const Container = styled.div`
  flex-shrink: 0;

  position: relative;
  height: ${props => props.height}px;
  min-height: 2rem;
  width: 100%;
  background-color: ${props => props.theme.background.darken(0.3)};

  display: flex;
  align-items: center;
`;

type Props = {
  evaluateConsole: (command: string) => void,
};

const InputWrapper = styled.div`
  position: relative;
  /* height: 1.5rem; */
  height: ${props => props.height}px;
  width: 100%;
  /* border: none; */
  /* outline: none; */
  color: rgba(255, 255, 255, 0.8);
  font-family: Menlo, monospace;
  font-size: 13px;
`;

const monacoOptions = {
  wordWrap: 'on',
  overviewRulerLanes: 0,
  glyphMargin: false,
  lineNumbers: 'off',
  folding: false,
  selectOnLineNumbers: false,
  selectionHighlight: false,

  cursorStyle: 'line-thin',

  scrollbar: {
    useShadows: false,
    horizontal: 'hidden',
    verticalScrollbarSize: 9, // 0.5rem TODO: add this to resize scrollbar
  },
  lineDecorationsWidth: 0,
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  // fixedOverflowWidgets: true, //?
  // acceptSuggestionOnEnter: 'smart', //?
  minimap: {
    enabled: false,
  },

  contextmenu: false,

  // codesandbox configs (copied form editor)
  // ariaLabel: title, // ConsoleInput?
  // formatOnPaste: true, // check what others do
  // lineHeight: (preferences.lineHeight || 1.15) * preferences.fontSize,

  // TODO: remove InputWrapper styles
  fontFamily: 'Menlo, monospace',
  fontSize: 13,
};

// Monaco.js
// {
//       selectOnLineNumbers: true,
//       fontSize: preferences.fontSize,
//       // Disable this because of a current issue in Windows:
//       // https://github.com/Microsoft/monaco-editor/issues/392
//       // fontFamily: fontFamilies(
//       //   preferences.fontFamily,
//       //   'Source Code Pro',
//       //   'monospace',
//       // ),
//       minimap: {
//         enabled: false,
//       },
//       ariaLabel: title,
//       formatOnPaste: true,
//       lineHeight: (preferences.lineHeight || 1.15) * preferences.fontSize,
//     };

// vscode
// {
//   wordWrap: 'on',
//   overviewRulerLanes: 0,
//   glyphMargin: false,
//   lineNumbers: 'off',
//   folding: false,
//   selectOnLineNumbers: false,
//   selectionHighlight: false,
//   scrollbar: {
//     horizontal: 'hidden'
//   },
//   lineDecorationsWidth: 0,
//   scrollBeyondLastLine: false,
//   renderLineHighlight: 'none',
//   fixedOverflowWidgets: true,
//   acceptSuggestionOnEnter: 'smart',
//   minimap: { // no minimaps
//     enabled: false
//   }
// };

function noop() {
  return Promise.resolve();
}

class ConsoleInput extends React.PureComponent<Props> {
  state = {
    command: '',
    commandHistory: [],
    commandCursor: -1,

    containerHeight: 20, // 36,// '2rem',
  };

  editorWillMount = monaco => {
    // console.log(this.props.theme);
    // console.log(this.props.theme.background);
    // console.log(this.props.theme.background.darken(0.3)());
    // monaco.editor.defineTheme('CodeSandbox', {
    //   base: 'vs-dark', // can also be vs-dark or hc-black
    //   inherit: true, // can also be false to completely replace the builtin rules
    //   rules: [
    //     { token: 'comment', foreground: '626466' },
    //     { token: 'keyword', foreground: '6CAEDD' },
    //     { token: 'identifier', foreground: 'fac863' },
    //   ],
    //   colors: {
    //     'editor.background': '#1a1d1e'/*this.props.theme.background.darken(0.3)()*/,
    //   },
    // });
    // console.log(theme);
    // console.dir(Color);
    // console.log(new Color(theme.background.darken(0.3)()));

    const backgroundColor = new Color(
      theme.background.darken(0.3)()
    ).hexString();
    monaco.editor.defineTheme('CodeSandbox-DevTools-Input', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '626466' },
        { token: 'keyword', foreground: '6CAEDD' },
        { token: 'identifier', foreground: 'fac863' },
      ],
      colors: {
        'editor.background': backgroundColor, // '#1a1d1e'
        // 'editor.background': '#0000ff',
        // 'editor.background': 'yellow',
      },
    });
  };

  // TODO: keyboard handler, command

  editorDidMount = async (editor, monaco) => {
    console.log('editor:', editor);

    editor.onDidChangeModelContent(e => {
      // console.log(e);
      const lineCount = editor.getModel().getLineCount();
      // console.log(lineCount);
      const lineHeight = 20;
      const maxContainerHeight = 90;
      this.setState({ containerHeight: Math.min(90, lineCount * 20) });
      editor.layout();
    });

    editor.onKeyDown(e => {
      // console.log(e);
      e = e.browserEvent;
      const { evaluateConsole } = this.props;

      if (e.keyCode === 13) {
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        // Enter
        const command = editor.getModel().getValue();
        evaluateConsole(command);
        editor.setValue('');
        // evaluateConsole(this.state.command);
        this.setState({
          commandHistory: [command, ...this.state.commandHistory],
        });
      } else if (e.keyCode === 38) {
        const newCursor = Math.min(
          this.state.commandCursor + 1,
          this.state.commandHistory.length - 1
        );
        // Up arrow
        this.setState({
          command: this.state.commandHistory[newCursor] || '',
          commandCursor: newCursor,
        });
      } else if (e.keyCode === 40) {
        const newCursor = Math.max(this.state.commandCursor - 1, -1);
        // Down arrow
        this.setState({
          command: this.state.commandHistory[newCursor] || '',
          commandCursor: newCursor,
        });
      }
    });

    /*
    // on Monaco editor scroll change, adjust the height
    editor.onDidScrollChange(e => {
      if (!e.scrollHeightChanged) {
        return;
      }
      console.log(e.scrollHeight);
      console.log(e);

      this.setState({
        containerHeight: Math.min(90, e.scrollHeight)
      });

      // TODO
      // set monaco editor height
      editor.layout();
    });
    */
  };

  render() {
    return (
      <Container height={this.state.containerHeight + 12}>
        <IconContainer style={{ color: theme.secondary() }}>
          <ChevronRight />
        </IconContainer>
        <InputWrapper height={this.state.containerHeight}>
          <MonacoEditor
            width="100%"
            height="100%"
            theme="CodeSandbox-DevTools-Input"
            options={monacoOptions}
            editorDidMount={this.editorDidMount}
            editorWillMount={this.editorWillMount}
            openReference={noop}
          />
        </InputWrapper>
      </Container>
    );
    // return <div>hey</div>;
  }
}

export default ConsoleInput;
