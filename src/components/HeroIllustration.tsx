export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden='true'
    >
      {/* Background circle */}
      <circle cx='240' cy='200' r='180' fill='#e8f8f5' />
      <circle cx='240' cy='200' r='140' fill='#d5f5ec' opacity='0.6' />

      {/* Book stack - left */}
      <rect x='60' y='220' width='120' height='20' rx='4' fill='#6c5ce7' />
      <rect x='65' y='200' width='110' height='20' rx='4' fill='#00b894' />
      <rect x='55' y='180' width='130' height='20' rx='4' fill='#ff7675' />
      <rect x='70' y='160' width='100' height='20' rx='4' fill='#fdcb6e' />

      {/* Open book - center */}
      <path d='M180 180 L240 160 L300 180 L300 260 L240 240 L180 260 Z' fill='#ffffff' stroke='#6c5ce7' strokeWidth='2' />
      <path d='M240 160 L240 240' stroke='#6c5ce7' strokeWidth='2' />
      <line x1='195' y1='195' x2='230' y2='185' stroke='#d5f5ec' strokeWidth='2' strokeLinecap='round' />
      <line x1='195' y1='210' x2='230' y2='200' stroke='#d5f5ec' strokeWidth='2' strokeLinecap='round' />
      <line x1='195' y1='225' x2='230' y2='215' stroke='#d5f5ec' strokeWidth='2' strokeLinecap='round' />
      <line x1='250' y1='185' x2='285' y2='195' stroke='#d5f5ec' strokeWidth='2' strokeLinecap='round' />
      <line x1='250' y1='200' x2='285' y2='210' stroke='#d5f5ec' strokeWidth='2' strokeLinecap='round' />

      {/* Pencil - right */}
      <rect x='340' y='140' width='12' height='80' rx='2' fill='#fdcb6e' transform='rotate(15 346 180)' />
      <polygon points='340,220 346,240 352,220' fill='#fab1a0' transform='rotate(15 346 230)' />
      <rect x='340' y='140' width='12' height='10' rx='2' fill='#ff7675' transform='rotate(15 346 145)' />

      {/* Stars */}
      <path d='M100 120 L104 130 L114 130 L106 137 L109 147 L100 140 L91 147 L94 137 L86 130 L96 130 Z' fill='#ffeaa7' />
      <path d='M380 100 L383 107 L390 107 L384 112 L386 119 L380 114 L374 119 L376 112 L370 107 L377 107 Z' fill='#55efc4' />
      <path d='M160 100 L162 105 L167 105 L163 108 L165 113 L160 110 L155 113 L157 108 L153 105 L158 105 Z' fill='#ff7675' />

      {/* Lightbulb - top right */}
      <circle cx='370' cy='160' r='16' fill='#ffeaa7' stroke='#fdcb6e' strokeWidth='2' />
      <rect x='365' y='176' width='10' height='6' rx='2' fill='#fdcb6e' />
      <line x1='370' y1='150' x2='370' y2='145' stroke='#fdcb6e' strokeWidth='2' strokeLinecap='round' />
      <line x1='380' y1='155' x2='385' y2='150' stroke='#fdcb6e' strokeWidth='2' strokeLinecap='round' />
      <line x1='360' y1='155' x2='355' y2='150' stroke='#fdcb6e' strokeWidth='2' strokeLinecap='round' />

      {/* Graduation cap - top left */}
      <polygon points='120,140 160,125 200,140 160,155' fill='#6c5ce7' />
      <rect x='155' y='140' width='10' height='20' fill='#6c5ce7' />
      <circle cx='160' cy='160' r='4' fill='#ffeaa7' />

      {/* ABC blocks */}
      <rect x='80' y='260' width='35' height='35' rx='6' fill='#6c5ce7' />
      <text x='97' y='284' textAnchor='middle' fill='white' fontSize='18' fontWeight='bold' fontFamily='Fredoka, sans-serif'>A</text>
      <rect x='120' y='260' width='35' height='35' rx='6' fill='#00b894' />
      <text x='137' y='284' textAnchor='middle' fill='white' fontSize='18' fontWeight='bold' fontFamily='Fredoka, sans-serif'>B</text>
      <rect x='100' y='295' width='35' height='35' rx='6' fill='#ff7675' />
      <text x='117' y='319' textAnchor='middle' fill='white' fontSize='18' fontWeight='bold' fontFamily='Fredoka, sans-serif'>C</text>

      {/* Calculator */}
      <rect x='340' y='260' width='50' height='70' rx='8' fill='#2d3436' />
      <rect x='348' y='268' width='34' height='16' rx='3' fill='#55efc4' />
      <circle cx='355' cy='296' r='5' fill='#636e72' />
      <circle cx='375' cy='296' r='5' fill='#636e72' />
      <circle cx='355' cy='310' r='5' fill='#636e72' />
      <circle cx='375' cy='310' r='5' fill='#636e72' />
      <circle cx='355' cy='324' r='5' fill='#fdcb6e' />
      <circle cx='375' cy='324' r='5' fill='#6c5ce7' />

      {/* Floating particles */}
      <circle cx='300' cy='120' r='5' fill='#55efc4' opacity='0.7' />
      <circle cx='150' cy='280' r='4' fill='#fdcb6e' opacity='0.6' />
      <circle cx='400' cy='220' r='6' fill='#6c5ce7' opacity='0.5' />
      <circle cx='70' cy='160' r='4' fill='#ff7675' opacity='0.5' />
    </svg>
  )
}
