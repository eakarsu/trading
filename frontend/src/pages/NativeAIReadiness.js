import React from 'react';
import NativeRuntimeAI from '../components/NativeRuntimeAI';
import api from '../api/auth';
const request=(endpoint,body,options)=>api.post(endpoint,body,options).then(r=>r.data);
const loadHistory=()=>api.get('/runtime-ai/receipts').then(r=>r.data.data);
const config={
  "title": "Educational paper trading review",
  "description": "Native OpenRouter advisory review of supplied information. Examples are illustrative; existing records, evidence, approvals, permissions and operational controls remain authoritative. This response performs no external action.",
  "endpoint": "/runtime-ai/recommendation",
  "fields": [
    {
      "key": "prompt",
      "label": "Review brief",
      "required": true,
      "maxLength": 4000,
      "examples": [
        "Illustrative Educational paper trading review brief: review supplied source information, identify evidence gaps, and suggest three next steps for an authorized reviewer. No external action is authorized.",
        "Illustrative Educational paper trading review team review: compare options, dependencies, responsible reviewers, and timing. Explain missing evidence and approvals before any operational change.",
        "Illustrative Educational paper trading review detailed review: distinguish verified facts from assumptions, compare tradeoffs, and suggest measurable follow-up actions. Do not invent records, integrations, approvals, clinical findings or financial execution."
      ]
    }
  ]
};
export default function NativeAIReadiness(){return <NativeRuntimeAI config={config} request={request} loadHistory={loadHistory}/>;}
