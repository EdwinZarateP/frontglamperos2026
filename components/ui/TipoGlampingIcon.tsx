import { GiHabitatDome, GiHut, GiWoodCabin } from 'react-icons/gi'
import { MdOutlineCabin, MdOutlineHouse } from 'react-icons/md'
import { FaCaravan } from 'react-icons/fa'

interface Props {
  tipo: string
  size?: number
  className?: string
}

const GCS = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes'

export function TipoGlampingIcon({ tipo, size = 24, className = '' }: Props) {
  switch (tipo) {
    case 'domo':
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Domo%201.svg" alt="Domo" width={size} height={size} className={className} />
    case 'cabana':      
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Caba%C3%B1as%201.svg" alt="Cabaña" width={size} height={size} className={className} />      
    case 'tiny-house':
      return <MdOutlineHouse size={size} className={className} />
    case 'chalet':
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Chalet%201.svg" alt="Chalet" width={size} height={size} className={className} />    
    case 'tipi':      
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Tipis%201.svg" alt="Chalet" width={size} height={size} className={className} />    
    case 'lumipod':
      return <img src={`${GCS}/lumi.svg`} alt="Lumipod" width={size} height={size} className={className} />
    case 'loto':
      return <img src={`${GCS}/loto%20icono.png`} alt="Loto" width={size} height={size} className={className} />
    case 'bogota':
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Bogota2.svg" alt="Bogota" width={size} height={size} className={className} />
    case 'medellin':
      return <img src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos/icono%20Medellin%201.svg" alt="Medellin" width={size} height={size} className={className} />
    default:
      return <GiHabitatDome size={size} className={className} />
  }
}
