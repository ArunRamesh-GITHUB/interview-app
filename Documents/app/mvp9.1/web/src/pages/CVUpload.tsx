
import React from 'react'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'

export default function CVUpload(){
  const [text,setText] = React.useState(localStorage.getItem('cvText')||'')
  
  return (
    <div className="space-y-3 max-w-none mt-8">
      <Textarea 
        value={text} 
        onChange={e=>setText(e.target.value)} 
        placeholder="Paste your CV text here. (Kept locally in your browser only.)" 
        className="h-96 resize-y"
      />
      <div className="flex gap-3">
        <Button onClick={()=>{ localStorage.setItem('cvText', text); alert('Saved locally. This is not uploaded anywhere.'); }}>Save</Button>
        <Button onClick={()=>{ localStorage.removeItem('cvText'); setText('') }}>Clear</Button>
      </div>
      <p className="text-sm text-text-secondary">This page stores the text only in your browser (localStorage). The Live and Drill pages read it when present.</p>
    </div>
  )
}
