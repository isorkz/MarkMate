import useStore from '../../../store/MStore';

const TocView = () => {
  const showTocPanel = useStore((state) => state.showTocPanel);

  return (
    // flex-none: don't grow or shrink, fixed width
    // Use 'w-0' to hide the left sidebar instead of 'hidden', to have a smooth transition effect.
    <div className={`flex flex-none h-full bg-gray-50 ${showTocPanel ? 'w-[15rem]' : 'w-0'} transition-all duration-300`}>TocView</div>
  )
}

export default TocView