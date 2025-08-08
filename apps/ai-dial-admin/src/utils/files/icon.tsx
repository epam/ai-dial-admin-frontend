import Cpp from '@/public/images/icons/file/cpp.svg';
import C from '@/public/images/icons/file/c.svg';
import Cs from '@/public/images/icons/file/cs.svg';
import Ini from '@/public/images/icons/file/ini.svg';
import Json from '@/public/images/icons/file/json.svg';
import Md from '@/public/images/icons/file/md.svg';
import Py from '@/public/images/icons/file/py.svg';
import {
  IconFile,
  IconFileTypeBmp,
  IconFileTypeCss,
  IconFileTypeCsv,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypeHtml,
  IconFileTypeJpg,
  IconFileTypeJs,
  IconFileTypeJsx,
  IconFileTypePdf,
  IconFileTypePhp,
  IconFileTypePng,
  IconFileTypePpt,
  IconFileTypeRs,
  IconFileTypeSql,
  IconFileTypeSvg,
  IconFileTypeTs,
  IconFileTypeTsx,
  IconFileTypeTxt,
  IconFileTypeVue,
  IconFileTypeXls,
  IconFileTypeXml,
  IconFileTypeZip,
} from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

export const getIcon = (extension: string) => {
  switch (extension) {
    case '.bmp':
      return <IconFileTypeBmp {...BASE_ICON_PROPS} />;
    case '.cpp':
      return <Cpp />;
    case '.c':
      return <C />;
    case '.cs':
      return <Cs />;
    case '.css':
      return <IconFileTypeCss {...BASE_ICON_PROPS} />;
    case '.csv':
      return <IconFileTypeCsv {...BASE_ICON_PROPS} />;
    case '.doc':
      return <IconFileTypeDoc {...BASE_ICON_PROPS} />;
    case '.docx':
      return <IconFileTypeDocx {...BASE_ICON_PROPS} />;
    case '.html':
      return <IconFileTypeHtml {...BASE_ICON_PROPS} />;
    case '.ini':
      return <Ini />;
    case '.jpg':
      return <IconFileTypeJpg {...BASE_ICON_PROPS} />;
    case '.js':
      return <IconFileTypeJs {...BASE_ICON_PROPS} />;
    case '.json':
      return <Json />;
    case '.jsx':
      return <IconFileTypeJsx {...BASE_ICON_PROPS} />;
    case '.md':
      return <Md />;
    case '.pdf':
      return <IconFileTypePdf {...BASE_ICON_PROPS} />;
    case '.php':
      return <IconFileTypePhp {...BASE_ICON_PROPS} />;
    case '.png':
      return <IconFileTypePng {...BASE_ICON_PROPS} />;
    case '.ppt':
      return <IconFileTypePpt {...BASE_ICON_PROPS} />;
    case '.py':
      return <Py />;
    case '.rs':
      return <IconFileTypeRs {...BASE_ICON_PROPS} />;
    case '.sql':
      return <IconFileTypeSql {...BASE_ICON_PROPS} />;
    case '.svg':
      return <IconFileTypeSvg {...BASE_ICON_PROPS} />;
    case '.ts':
      return <IconFileTypeTs {...BASE_ICON_PROPS} />;
    case '.tsx':
      return <IconFileTypeTsx {...BASE_ICON_PROPS} />;
    case '.txt':
      return <IconFileTypeTxt {...BASE_ICON_PROPS} />;
    case '.vue':
      return <IconFileTypeVue {...BASE_ICON_PROPS} />;
    case '.xls':
      return <IconFileTypeXls {...BASE_ICON_PROPS} />;
    case '.xml':
      return <IconFileTypeXml {...BASE_ICON_PROPS} />;
    case '.zip':
      return <IconFileTypeZip {...BASE_ICON_PROPS} />;
    default:
      return <IconFile {...BASE_ICON_PROPS} />;
  }
};
