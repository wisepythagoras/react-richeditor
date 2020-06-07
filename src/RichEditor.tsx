import * as React from 'react';
import styled from 'styled-components';

const EditorWrapper = styled.div`
    border-radius: 5px;
    padding: 15px;
    border: 1px solid #fafafa;
    display: grid;
    grid-template-rows: 150px 1fr;
    max-width: 1000px;

    &:hover {
        border: 1px solid #f0f0f0;
    }
`;

const GhostEditor = styled.textarea`
    color: transparent;
    font-family: inherit;
    font-size: 14px;
    caret-color: #333;
    resize: none;
    border: none;
    width: 100%;
    max-width: inherit;
    grid-area: 1 / 1 / 2 / 2;
    word-break: break-all;
    outline: 0;
`;

const DisplayBlock = styled.div`
    background-color: transparent;
    font-size: 14px;
    padding-left: 1px;
    grid-area: 1 / 1 / 2 / 2;
    width: 100%;
    max-width: inherit;
    word-break: break-all;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
`;

interface REProps {
    defaultValue?: string;
}

interface REState {
    value: string;
    richValue: JSX.Element|null;
    textWidth: number;
    mouseDownPos: number;
}

const getTextWidth = (text: string, font: string) => {
    const canvas: any = document.createElement('canvas');
    const context: any = canvas.getContext('2d');

    context.font = font || getComputedStyle(document.body).font;

    return context.measureText(text).width;
};

const parseDimension = (str: string) => {
    if (str) {
        const tempWidth = str.match(/(\d+)px$/);

        if (tempWidth && tempWidth.length > 1) {
            return parseInt(tempWidth[1], 10) || 1;
        }
    }

    return 1;
};

class RichEditor extends React.Component<REProps, REState> {
    textInput: any;

    /**
     * Create a new RichEditor.
     * @param props The components props.
     */
    constructor(props: REProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);

        this.textInput = React.createRef();

        this.state = {
            value: props.defaultValue || '',
            richValue: null,
            textWidth: 0,
            mouseDownPos: 0,
        };
    }

    /**
     * Parse the contents in the string and return a JSX.Element type with the
     * rich content.
     * @returns {JSX.Element}
     */
    _parseContent(text: string) : JSX.Element {
        return (
            <span>{text.split(' ').map((word: string) => {
                // Check for a hashtag.
                const foundHashtag = word.match(/^#(\w+)([!.,/;'"?]*)$/);

                if (foundHashtag && foundHashtag.length > 1) {
                    return (
                        <span>
                            <a href={`/hashtag/${foundHashtag[1]}`}>
                                #{foundHashtag[1]}
                            </a>
                            {foundHashtag.length == 3 ? foundHashtag[2] : ''}&nbsp;
                        </span>
                    );
                }

                // Now check for a user.
                const foundUser = word.match(/^@([a-zA-Z0-9\-\_]+)([!.,/;'"?]*)$/);

                if (foundUser && foundUser.length > 1) {
                    return (
                        <span>
                            <a href={`/${foundUser[1]}`}>
                                @{foundUser[1]}
                            </a>
                            {foundUser.length == 3 ? foundUser[2] : ''}&nbsp;
                        </span>
                    );
                }

                return `${word} `;
            })}</span>
        );
    }

    /**
     * When the input value changes.
     * @param e The change event.
     */
    onChange(e: any) {
        const value = e.target.value;
        const style = getComputedStyle(this.textInput.current);
        const font = `${style.fontSize} ${style.fontFamily}`;
        const textWidth = getTextWidth(value, font);

        this.setState({
            value,
            richValue: this._parseContent(value),
            textWidth,
        });
    }

    /**
     * Get the cursor position for a given mouse event.
     * @param e The mouse event.
     * @returns {number}
     */
    getPositionOnMouseEvent(e: any) {
        const style = getComputedStyle(this.textInput.current);
        const styleWidth: number = parseDimension(style.width);
        //const styleHeight: number = parseDimension(style.height);

        // Get the number of rows in the textarea.
        const rows = Math.ceil(this.state.textWidth / styleWidth);

        // We need the approximate width of a character in a string.
        const charWidth = !!this.state.value ?
            this.state.textWidth / this.state.value.length :
            1;

        // Same for the char height;
        const charHeight = parseDimension(style.fontSize) + 2;

        // This will show us how many characters we can have on a single row.
        const charPerRow = Math.floor(styleWidth / charWidth);
        console.log('[INFO]: charsPerRow', charPerRow);

        const { offsetTop, offsetLeft } = this.textInput.current;
        const clickX = e.pageX - offsetLeft;
        const clickY = e.pageY - offsetTop;
        console.log('[CLICK]:', clickX, clickY);
        
        const clickCol = Math.round(clickX / charWidth);
        const clickRow = Math.floor(clickY / charHeight);
        console.log('[INFO]', clickCol, clickRow);

        return clickCol + clickRow * charPerRow;
    }

    /**
     * When the display div is clicked.
     * @param e The change event.
     */
    onMouseDown(e: any) {
        this.setState({
            mouseDownPos: this.getPositionOnMouseEvent(e),
        });
    }

    /**
     * When the display div is clicked.
     * @param e The change event.
     */
    onMouseUp(e: any) {
        const mouseUpPos = this.getPositionOnMouseEvent(e);
        const mouseDownPos = this.state.mouseDownPos;

        this.textInput.current.focus();
        this.textInput.current.selectionStart = mouseUpPos > mouseDownPos ? mouseDownPos : mouseUpPos;
        this.textInput.current.selectionEnd = mouseUpPos > mouseDownPos ? mouseUpPos : mouseDownPos;

        this.setState({ mouseDownPos: 0 });
    }

    /**
     * Render the components.
     */
    render(): JSX.Element {
        return (
            <EditorWrapper>
                <GhostEditor
                    value={this.state.value}
                    onChange={this.onChange}
                    ref={this.textInput}
                />
                <DisplayBlock onMouseUp={this.onMouseUp} onMouseDown={this.onMouseDown}>
                    {this.state.richValue}
                </DisplayBlock>
                {/* <div style={{
                    height: `20px`,
                    width: `${this.state.textWidth}px`,
                    background: 'red',
                }} /> */}
            </EditorWrapper>
        );
    }
}

export default RichEditor;

