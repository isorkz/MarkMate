import TabsNav from '../tabs/TabsNav';
import { EditorPanel } from '../editor/EditorPanel';
import useStore from '../../store/MStore';

const MainPanel = () => {
  const tabs = useStore((state) => state.tabs);
  const activeTabIndex = useStore((state) => state.activeTabIndex);

  return (
    <div className='flex flex-col w-full h-full overflow-x-hidden'>
      <TabsNav />

      <>
        {tabs.map((tab, index) => (
          <div key={index} className={`flex w-full h-full overflow-x-hidden ${activeTabIndex === index ? '' : 'hidden'}`}>
            {/* NOTE: must use the 'key' prop to make sure the component is re-rendered when the tab is changed. 
            Otherwise, the content of the tab will be mixed up. */}
            <EditorPanel tab={tab} tabIndex={index} key={index} />
          </div>
        ))}
      </>
    </div>
  )
}

export default MainPanel