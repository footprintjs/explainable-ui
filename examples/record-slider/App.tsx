import { useState } from 'react';
import type { ComponentProps } from 'react';
import { RecordLens, RecordTimeSlider } from 'footprint-explainable-ui/record';
import type { RecordLensInput } from 'footprint-explainable-ui/record';
import { HostDiagram } from './HostDiagram';
import { VizDiagram } from './VizDiagram';
import { recordings } from './recordings';
import type { RecordingId } from './recordings';

type SliderProps = ComponentProps<typeof RecordTimeSlider>;
type Scale = NonNullable<SliderProps['scale']>;
type Presentation = NonNullable<SliderProps['presentation']>;

const hints: Record<RecordingId, string> = {
  pricing: 'Select Quote, then choose Why? beside quote to see which recorded writes produced 11.88.',
  combined: 'Select Combine and choose Why? beside total. Follow its two recorded inputs to Items and Delivery, then return to the original question.',
  storefront: 'Select checkout#3, then choose Why? beside orderId to trace the recorded checkout. The pending action has no committed stop.',
  go: 'Select the invoice calculation, then choose Why? beside invoiceTotal to follow its recorded subtotal.',
  viz: 'Select assign quantile bins, then choose Why? beside cluster_id to find the recorded amounts and bin count.',
};

function Viewer({ recording, scale, presentation }: { recording: RecordingId; scale: Scale; presentation: Presentation }) {
  const { reader, durationForStop } = recordings[recording];
  const [step, setStep] = useState(0);
  const [selectedKey, setSelectedKey] = useState<RecordLensInput['selectedKey']>();
  return <>
    <section className="transport" aria-label="Replay position">
      <RecordTimeSlider stops={reader.stops} step={step} onStepChange={setStep}
        durationForStop={durationForStop} scale={scale} presentation={presentation} />
    </section>
    {recording === 'viz' ? <VizDiagram stops={reader.stops} step={step} onStepChange={setStep} /> :
      <HostDiagram recording={recording} stops={reader.stops} step={step} onStepChange={setStep} />}
    <p className="hint">{hints[recording]}</p>
    <RecordLens reader={reader} step={step} selectedKey={selectedKey}
      onStepChange={setStep} onKeyChange={setSelectedKey} />
  </>;
}

export function App() {
  const [recording, setRecording] = useState<RecordingId>('pricing');
  const [scale, setScale] = useState<Scale>('log-duration');
  const [presentation, setPresentation] = useState<Presentation>('segmented');
  return <main>
    <a className="back" href="../">← Gallery</a>
    <h1>Foottrace record slider</h1>
    <p className="intro">Choose a saved recording. The slider, diagram and state inspector follow one recorded stop.</p>
    <div className="controls">
      <label>Recording<select value={recording} onChange={event => {
        const value = event.currentTarget.value;
        if (value === 'pricing' || value === 'combined' || value === 'storefront' || value === 'viz' || value === 'go') setRecording(value);
      }}>
        <option value="pricing">Pricing workflow</option>
        <option value="combined">Parallel order total</option>
        <option value="go">Go invoice</option>
        <option value="storefront">HCI storefront</option>
        <option value="viz">Viz amount clusters</option>
      </select></label>
      <label>Slider spacing<select value={scale} onChange={event => {
        const value = event.currentTarget.value;
        if (value === 'steps' || value === 'duration' || value === 'log-duration') setScale(value);
      }}>
        <option value="steps">Equal steps</option>
        <option value="duration">Recorded duration · linear</option>
        <option value="log-duration">Recorded duration · logarithmic</option>
      </select></label>
      <label>Slider style<select value={presentation} onChange={event =>
        setPresentation(event.currentTarget.value === 'range' ? 'range' : 'segmented')}>
        <option value="segmented">Segments</option>
        <option value="range">Range</option>
      </select></label>
    </div>
    <Viewer key={recording} recording={recording} scale={scale} presentation={presentation} />
  </main>;
}
