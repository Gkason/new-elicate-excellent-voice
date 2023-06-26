import styled from '@emotion/styled';
import { Button, ActionIcon, Textarea, Loader, Popover } from '@mantine/core';
import { getHotkeyHandler, useHotkeys, useMediaQuery } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../core/context';
import { useAppDispatch, useAppSelector } from '../store';
import { selectMessage, setMessage } from '../store/message';
import { selectSettingsTab, openOpenAIApiKeyPanel } from '../store/settings-ui';
import { speechRecognition, supportsSpeechRecognition } from '../core/speech-recognition-types'
import { useWhisper } from '@chengsokdara/use-whisper';
import QuickSettings from './quick-settings';
import { useOption } from '../core/options/use-option';

const Container = styled.div`
    background: #292933;
    border-top: thin solid #393933;
    padding: 1rem 1rem 0 1rem;

    .inner {
        max-width: 50rem;
        margin: auto;
        text-align: right;
    }

    .settings-button {
        margin: 0.5rem -0.4rem 0.5rem 1rem;
        font-size: 0.7rem;
        color: #999;
    }
`;

export declare type OnSubmit = (name?: string) => Promise<boolean>;

export interface MessageInputProps {
    disabled?: boolean;
}

export default function MessageInput(props: MessageInputProps) {
    const message = useAppSelector(selectMessage);
    const [recording, setRecording] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const hasVerticalSpace = useMediaQuery('(min-height: 1000px)');
    const [useOpenAIWhisper] = useOption<boolean>('speech-recognition', 'use-whisper');
    const [openAIApiKey] = useOption<string>('openai', 'apiKey');

    const [initialMessage, setInitialMessage] = useState('');
    const {
        transcribing,
        transcript,
        startRecording,
        stopRecording,
    } = useWhisper({
        apiKey: openAIApiKey || ' ',
        streaming: false,
    });

    const navigate = useNavigate();
    const context = useAppContext();
    const dispatch = useAppDispatch();
    const intl = useIntl();

    const tab = useAppSelector(selectSettingsTab);

    const [showMicrophoneButton] = useOption<boolean>('speech-recognition', 'show-microphone');
    const [submitOnEnter] = useOption<boolean>('input', 'submit-on-enter');

    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(setMessage(e.target.value));
    }, [dispatch]);

    const pathname = useLocation().pathname;

    const onSubmit = useCallback(async () => {
        setSpeechError(null);

        const id = await context.onNewMessage(message);

        if (id) {
            if (!window.location.pathname.includes(id)) {
                navigate('/chat/' + id);
            }
            dispatch(setMessage(''));
        }
    }, [context, message, dispatch, navigate]);

    const onSpeechError = useCallback((e: any) => {
        console.error('speech recognition error', e);
        setSpeechError(e.message);
    }, []);

    const onHideSpeechError = useCallback(() => setSpeechError(null), []);



    const onHideSpeechError = useCallback(() => setSpeechError(null), []);

    useEffect(() => {
        if (transcript && !message && submitOnEnter) {
            onSubmit();
        }
    }, [transcript, message, onSubmit, submitOnEnter]);

    const handleSpeechRecognition = useCallback(async () => {
        if (!supportsSpeechRecognition()) {
            setSpeechError(intl.formatMessage({ id: 'messageInput.speechRecognitionNotSupported' }));
            return;
        }

        if (recording) {
            stopRecording();
            setRecording(false);
        } else {
            try {
                await startRecording();
                setRecording(true);
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                setSpeechError(error.message);
            }
        }
    }, [recording, startRecording, stopRecording, intl]);

    const handleSpeechRecognitionStop = useCallback(async () => {
        try {
            stopRecording();
            setRecording(false);

            if (transcript && useOpenAIWhisper) {
                dispatch(setMessage(transcript));
            }
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
            setSpeechError(error.message);
        }
    }, [stopRecording, dispatch, transcript, useOpenAIWhisper]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && event.ctrlKey) {
                event.preventDefault();
                onSubmit();
            }
        },
        [onSubmit]
    );

    const handleClearClick = useCallback(() => {
        dispatch(setMessage(''));
    }, [dispatch]);

    const handleOpenAIWhisperToggle = useCallback(() => {
        if (!openAIApiKey) {
            dispatch(openOpenAIApiKeyPanel());
        } else {
            dispatch(setMessage(transcript));
        }
    }, [dispatch, openAIApiKey, transcript]);

    useEffect(() => {
        setInitialMessage(message);
    }, [message]);

    const showClearButton = !!message;
    const showSettingsButton = !recording && !message;

    const microphoneButtonLabel = recording
        ? intl.formatMessage({ id: 'messageInput.stopRecording' })
        : intl.formatMessage({ id: 'messageInput.startRecording' });

    return (
        <Container>
            <div className="inner">
                <Textarea
                    id="message-input"
                    value={message}
                    onChange={onChange}
                    placeholder={intl.formatMessage({ id: 'messageInput.placeholder' })}
                    onKeyDown={handleKeyDown}
                    disabled={props.disabled || recording}
                    autoFocus={!hasVerticalSpace}
                    spellCheck={false}
                    style={{ resize: 'none' }}
                    rightSection={
                        <>
                            {showClearButton && (
                                <ActionIcon
                                    variant="hover"
                                    radius="sm"
                                    onClick={handleClearClick}
                                    title={intl.formatMessage({ id: 'messageInput.clearButton' })}
                                    aria-label={intl.formatMessage({ id: 'messageInput.clearButton' })}
                                >
                                    <Cross1Icon style={{ width: 12, height: 12 }} />
                                </ActionIcon>
                            )}

                            {showMicrophoneButton && (
                                <Button
                                    variant="transparent"
                                    leftIcon={recording ? <MicrophoneOffIcon /> : <MicrophoneIcon />}
                                    onClick={handleSpeechRecognition}
                                    onMouseDown={handleSpeechRecognitionStop}
                                    title={microphoneButtonLabel}
                                    aria-label={microphoneButtonLabel}
                                    disabled={props.disabled}
                                    loading={transcribing}
                                    style={{ marginRight: '0.5rem' }}
                                />
                            )}




<Popover
                                opened={speechError !== null}
                                onClose={onHideSpeechError}
                                targetWrapperProps={{ style: { display: 'inline-block' } }}
                                position="top"
                                transition="fade"
                                padding="xs"
                            >
                                <div style={{ maxWidth: '20rem' }}>
                                    <Alert
                                        title={intl.formatMessage({ id: 'messageInput.speechErrorTitle' })}
                                        color="red"
                                        shadow="xs"
                                        closeButtonProps={{
                                            onClick: onHideSpeechError,
                                            title: intl.formatMessage({ id: 'messageInput.closeSpeechError' }),
                                            'aria-label': intl.formatMessage({ id: 'messageInput.closeSpeechError' }),
                                        }}
                                    >
                                        {speechError}
                                    </Alert>
                                </div>
                            </Popover>
                        </>
                    }
                />

                {recording && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <Loader size="xs" />
                    </div>
                )}

                {showSettingsButton && (
                    <Button
                        size="xs"
                        variant="link"
                        color="gray"
                        className="settings-button"
                        onClick={() => navigate('/settings?tab=' + tab)}
                    >
                        <FormattedMessage id="messageInput.settingsButton" defaultMessage="Settings" />
                    </Button>
                )}

                <QuickSettings />

                <div style={{ marginTop: '0.5rem' }}>
                    {submitOnEnter && (
                        <div>
                            <small>
                                <FormattedMessage
                                    id="messageInput.submitOnEnterInfo"
                                    defaultMessage="Press Ctrl + Enter to submit"
                                />
                            </small>
                        </div>
                    )}

                    {useOpenAIWhisper && (
                        <div>
                            <small>
                                <FormattedMessage
                                    id="messageInput.openAIWhisperInfo"
                                    defaultMessage="Press Enter to use OpenAI Whisper"
                                />
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}
