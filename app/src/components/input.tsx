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
  } = speechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
  });

  const dispatch = useAppDispatch();
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useAppSelector(selectSettingsTab);

  const handleSubmit = useCallback(
    async (name?: string) => {
      if (!message.trim()) {
        return false;
      }

      const success = await dispatch(setMessage({ message, name }));

      if (success) {
        setInitialMessage('');
      }

      return success;
    },
    [dispatch, message],
  );

  useEffect(() => {
    if (transcript && !recording) {
      handleSubmit();
    }
  }, [transcript, recording, handleSubmit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleStartRecording = useCallback(() => {
    setRecording(true);
    setSpeechError(null);
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    setRecording(false);
    stopRecording();
  }, [stopRecording]);

  const handleSpeechError = useCallback((error: SpeechRecognitionError) => {
    setRecording(false);
    setSpeechError(error.error);
  }, []);

  const handleSettingsButtonClick = useCallback(() => {
    setQuickSettingsOpen(true);
  }, []);

  const handleQuickSettingsClose = useCallback(() => {
    setQuickSettingsOpen(false);
  }, []);

  const handleSettingsTabChange = useCallback(
    (tab: string) => {
      setSettingsTab(tab);
    },
    [setSettingsTab],
  );

  const handleOpenAIApiKeyPanel = useCallback(() => {
    dispatch(openOpenAIApiKeyPanel());
  }, [dispatch]);

  const hotkeyHandler = useMemo(
    () =>
      getHotkeyHandler({
        'mod+enter': handleSubmit,
        'mod+shift+enter': handleStartRecording,
      }),
    [handleSubmit, handleStartRecording],
  );

  useHotkeys(hotkeyHandler);

  const whisper = useWhisper({
    apiKey: openAIApiKey,
    useWhisper: useOpenAIWhisper,
  });

  return (
    <Container>
      <div className="inner">
        <Textarea
          value={message}
          onChange={(event) => setInitialMessage(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={props.disabled}
          placeholder={intl.formatMessage({ id: 'messageInput.placeholder' })}
          style={{ resize: 'none' }}
          rows={1}
        />
        <div>
          {recording ? (
            <Button onClick={handleStopRecording} color="red">
              <FormattedMessage id="messageInput.stopRecording" defaultMessage="Stop" />
            </Button>
          ) : (
            <Button onClick={handleStartRecording}>
              <FormattedMessage id="messageInput.startRecording" defaultMessage="Speak" />
            </Button>
          )}
          {speechError && <div>{speechError}</div>}
          <Button
            className="settings-button"
            variant="link"
            onClick={handleSettingsButtonClick}
          >
            <FormattedMessage id="messageInput.settings" defaultMessage="Settings" />
          </Button>
          <QuickSettings
            open={quickSettingsOpen}
            onClose={handleQuickSettingsClose}
            activeTab={settingsTab}
            onTabChange={handleSettingsTabChange}
            onOpenAIApiKeyPanel={handleOpenAIApiKeyPanel}
          />
        </div>
      </div>
    </Container>
  );
}