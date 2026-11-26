import { useRef, useState, type ChangeEvent } from "react"
const BrightnessTool = () => {


const [imgUrl, setImgUrl ] = useState('');
const [fileName, setFileName] = useState('');

const [brightness, setBrightness ] = useState(100);
const [brightnessInput, setBrightnessInput] = useState('100');
const imgRef = useRef<HTMLImageElement>(null) //미리보기 

const filterText = `brightness(${brightness}%)`

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if(!file) return;

  const fileURL = URL.createObjectURL(file);
  setImgUrl(fileURL);
  setFileName(file.name)

}

const handleLoadSample = () => {
  setImgUrl('/sample.png')
  setFileName('sample.png')
  setBrightnessInput('100')   // 밝기도 처음 값으로 되돌리기
  setBrightness(100)
}

const handleDownload = () => {
  const img = imgRef.current
  if (!img) return

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.filter = filterText;
  ctx.drawImage(img, 0,0)

  canvas.toBlob((blob: Blob | null) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'filtered.png'
      a.click()
    }, 'image/png')
}

return (
  <div className="p-20 flex flex-col gap-5 ">
    
    <div className="flex items-center gap-3">
      <span> 1. png 이미지 선택</span>
    </div>

      <div>
        <button
        type="button"
        onClick={handleLoadSample}
        className="text-blue-600 underline underline-offset-4 mb-5"
        >
         + 샘플 이미지로 시작
        </button>
      <p className="flex gap-5 items-center border-2 p-5">
        <label htmlFor="fileInput"
          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          이미지 선택
        </label>
        <span className="text-sm text-gray-500">{fileName || '선택된 파일 없음'}</span>
        <input type="file" id="fileInput" accept="image/png" onChange={handleFileChange} 
        className="sr-only"/>
      </p>
    </div>
    
    2. 밝기 비율선택
    <div className="flex items-center border-2">
      <p className="flex gap-4 p-5">
        <label htmlFor="brightnessInput">밝기(%)</label>
        <input type="text" id="brightnessInput" value={brightnessInput} 
        onChange={(e) => setBrightnessInput(e.target.value)}
        className="text-center border-2 w-20"
      />
      </p>
      <button onClick={() => setBrightness(Math.max(0, Number(brightnessInput)) || 0)} disabled={!imgUrl} 
      className="rounded-md w-20 text-xs border-2 hover:bg-gray-50 h-10
      disabled:bg-gray-100 disabled:text-gray-400 disabled:border-0 
      ">적용</button>
    </div>

    <div className="border-2 p-5">
      <p>적용 값: <code>{filterText}</code></p>
    </div>

    
    <span> 3. 다운로드</span>
    <div className="border-2 p-5">
      <div className="flex items-center gap-5 justify-start">
        <p>미리보기 이미지</p>
        <button type="button" id="downloadBtn" onClick={handleDownload} disabled={!imgUrl}
        className="bg-blue-600 p-2 pr-3 pl-3 rounded-sm text-white
        disabled:bg-gray-100 disabled:text-gray-400" 
        >다운로드</button>
      </div>
      {imgUrl && (
        <img
          ref={imgRef}
          src={imgUrl}
          alt="미리보기"
          style={{ maxWidth: 500, display: 'block', marginTop: 16, filter: filterText }}
        />
        
      )}

    </div>

    </div>
)}

export default BrightnessTool