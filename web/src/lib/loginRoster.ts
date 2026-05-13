/**
 * 允许登录的「学号 → 姓名」白名单，与仓库根目录 `number.md` 一致。
 * 服务端同一份数据内联在 `api/server.mjs`（`LOGIN_ROSTER_BY_STUDENT_ID`），修改名单时请一并更新。
 */
export const LOGIN_ROSTER_BY_STUDENT_ID: Readonly<Record<string, string>> =
  Object.freeze({
    '1': '蔡雨何',
    '2': '曾昱棋',
    '3': '陈筱萱',
    '4': '方俊楠',
    '5': '封依',
    '6': '何亚楠',
    '7': '何裕翔',
    '8': '洪晨钦',
    '9': '金禹枭',
    '10': '金智炫',
    '11': '李安',
    '12': '李逸豪',
    '13': '刘嘉乐',
    '14': '陆佳涛',
    '15': '陆艺桐',
    '16': '骆辰娜',
    '17': '马铭阳',
    '18': '毛高默',
    '19': '倪嘉言',
    '20': '彭懿',
    '21': '沈旭东',
    '22': '孙浩淙',
    '23': '孙婧',
    '24': '孙俊哲',
    '25': '孙绮璐',
    '26': '孙晓楠',
    '27': '汤铭宇',
    '28': '唐子成',
    '29': '汪芷奕',
    '30': '吴一涵',
    '31': '吴逸天',
    '32': '谢睿泽',
    '33': '徐朗宁',
    '34': '徐史晨鹤',
    '35': '徐依雯',
    '36': '许佳燊',
    '37': '许鋆涵',
    '39': '杨蒣乐',
    '40': '余晨义',
    '41': '俞美伦',
    '42': '俞雨灵',
    '43': '张博豪',
    '44': '张之钰',
    '45': '张之珏',
    '46': '章程好',
    '47': '章一琳',
    '48': '赵一涵',
    '49': '朱婧妤',
    '50': '朱奕辰',
    '123': '许老师',
    '6811': 'yxz',
    '708': 'teacher',
  })

/**
 * 判断学号与姓名是否同时命中白名单（trim 后精确匹配姓名）。
 *
 * @param studentId 学号
 * @param displayName 姓名
 */
export function isAllowedLoginPair(studentId: string, displayName: string): boolean {
  const sid = studentId.trim()
  const name = displayName.trim()
  const expected = LOGIN_ROSTER_BY_STUDENT_ID[sid]
  return expected !== undefined && expected === name
}
