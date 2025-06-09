import Cpp from '@/public/images/icons/file/cpp.svg';
import C from '@/public/images/icons/file/c.svg';
import Cs from '@/public/images/icons/file/cs.svg';
import File from '@/public/images/icons/file/file.svg';
import Ini from '@/public/images/icons/file/ini.svg';
import Json from '@/public/images/icons/file/json.svg';
import Md from '@/public/images/icons/file/md.svg';
import Py from '@/public/images/icons/file/py.svg';
import {
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

export const getIcon = (extension: string) => {
  switch (extension) {
    case '.bmp':
      return <IconFileTypeBmp width={18} height={18} />;
    case '.cpp':
      return <Cpp />;
    case '.c':
      return <C />;
    case '.cs':
      return <Cs />;
    case '.css':
      return <IconFileTypeCss width={18} height={18} />;
    case '.csv':
      return <IconFileTypeCsv width={18} height={18} />;
    case '.doc':
      return <IconFileTypeDoc width={18} height={18} />;
    case '.docx':
      return <IconFileTypeDocx width={18} height={18} />;
    case '.html':
      return <IconFileTypeHtml width={18} height={18} />;
    case '.ini':
      return <Ini />;
    case '.jpg':
      return <IconFileTypeJpg width={18} height={18} />;
    case '.js':
      return <IconFileTypeJs width={18} height={18} />;
    case '.json':
      return <Json />;
    case '.jsx':
      return <IconFileTypeJsx width={18} height={18} />;
    case '.md':
      return <Md />;
    case '.pdf':
      return <IconFileTypePdf width={18} height={18} />;
    case '.php':
      return <IconFileTypePhp width={18} height={18} />;
    case '.png':
      return <IconFileTypePng width={18} height={18} />;
    case '.ppt':
      return <IconFileTypePpt width={18} height={18} />;
    case '.py':
      return <Py />;
    case '.rs':
      return <IconFileTypeRs width={18} height={18} />;
    case '.sql':
      return <IconFileTypeSql width={18} height={18} />;
    case '.svg':
      return <IconFileTypeSvg width={18} height={18} />;
    case '.ts':
      return <IconFileTypeTs width={18} height={18} />;
    case '.tsx':
      return <IconFileTypeTsx width={18} height={18} />;
    case '.txt':
      return <IconFileTypeTxt width={18} height={18} />;
    case '.vue':
      return <IconFileTypeVue width={18} height={18} />;
    case '.xls':
      return <IconFileTypeXls width={18} height={18} />;
    case '.xml':
      return <IconFileTypeXml width={18} height={18} />;
    case '.zip':
      return <IconFileTypeZip width={18} height={18} />;
    default:
      return <File />;
  }
};
