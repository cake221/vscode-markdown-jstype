// tsc typeFun.ts
import {
  TypeAlias,
  ObjectTypeAnnotation,
  ObjectTypeProperty,
  Identifier,
  GenericTypeAnnotation,
  UnionTypeAnnotation,
  NullLiteralTypeAnnotation,
  StringTypeAnnotation,
  AnyTypeAnnotation,
  NumberTypeAnnotation,
  IntersectionTypeAnnotation,
  FunctionTypeAnnotation,
  NullableTypeAnnotation,
  MixedTypeAnnotation,
  BooleanTypeAnnotation,
  File,
  Program,
  ExportNamedDeclaration,
  VariableDeclaration,
  VariableDeclarator,
  NumericLiteral
} from "@babel/types";

const TypeFuns: {
  [key: string]: (obj: any) => {key?: any, value?: any, meta?: any, result?: any}
} = {}

export function TypeFun(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj

  if (Object.prototype.toString.call(obj) === "[object Array]") {
    const res = []
    for (let i = 0; i < obj.length; i++) {
      res[i] = TypeFun(obj[i])
    }
    return res;
  }

  if (Object.prototype.toString.call(obj) === "[object Object]") {
    const { type } = obj
    if (type && !!TypeFuns[type]) {
      let {key, value, result, meta = {}} = TypeFuns[type](obj)
      if (!!result) return result;
      if (!!value) value = TypeFun(value)
      if (!!key) {
        // TODO: 如何将附带信息传下去
        // if (Object.prototype.toString.call(value) === "[object Object]") {
        //   return {
        //     [TypeFun(key)]: {...value, ...meta},
        //   }
        // }
        // if (Object.prototype.toString.call(value) === "[object Array]") {
        //   return {
        //     [TypeFun(key)]: [...value, meta],
        //   }
        // }
        return {
          [TypeFun(key)]: value,
        }
      }
      return value
    }
    console.error('没有此ast类型的修正函数, 增加函数', obj.type)
  }

  console.error('obj 值错误', obj)
}


TypeFuns['TypeAlias'] = (obj: TypeAlias) => ({key: obj.id.name, value: obj.right})
TypeFuns['ObjectTypeAnnotation'] = (obj: ObjectTypeAnnotation) => {
  const { properties } = obj;
  const result = {}
  for (let i = 0; i < properties.length; i++) {
    Object.assign(result, TypeFun(properties[i]))
  }
  return {result}
}

TypeFuns['ObjectTypeProperty'] = (obj: ObjectTypeProperty) => ({key: obj.key, value: obj.value})
TypeFuns['Identifier'] = (obj: Identifier) => ({value: obj.name})
TypeFuns['GenericTypeAnnotation'] = (obj: GenericTypeAnnotation) => ({value: obj.id})
TypeFuns['UnionTypeAnnotation'] = (obj: UnionTypeAnnotation) => ({value: obj.types, meta: {_type: 'UnionTypeAnnotation'}})
TypeFuns['NullLiteralTypeAnnotation'] = (obj: NullLiteralTypeAnnotation) => ({value: 'null'})
TypeFuns['StringTypeAnnotation'] = (obj: StringTypeAnnotation) => ({value: 'string'})
TypeFuns['AnyTypeAnnotation'] = (obj: AnyTypeAnnotation) => ({value: 'any'})
TypeFuns['NumberTypeAnnotation'] = (obj: NumberTypeAnnotation) => ({value: 'number'})
TypeFuns['IntersectionTypeAnnotation'] = (obj: IntersectionTypeAnnotation) => ({value: obj.types})
TypeFuns['FunctionTypeAnnotation'] = (obj: FunctionTypeAnnotation) => ({value: 'function'})
TypeFuns['NullableTypeAnnotation'] = (obj: NullableTypeAnnotation) => ({value: obj.typeAnnotation})
TypeFuns['MixedTypeAnnotation'] = (obj: MixedTypeAnnotation) => ({value: 'mixed'})
TypeFuns['BooleanTypeAnnotation'] = (obj: BooleanTypeAnnotation) => ({ value: 'boolean'})
TypeFuns['File'] = (obj: File) => ({ value: obj.program})
TypeFuns['Program'] = (obj: Program) => ({ value: obj.body})
TypeFuns['ExportNamedDeclaration'] = (obj: ExportNamedDeclaration) => ({ value: obj.declaration})
TypeFuns['VariableDeclaration'] = (obj: VariableDeclaration) => ({ value: obj.declarations})
TypeFuns['VariableDeclarator'] = (obj: VariableDeclarator) => ({ key: obj.id, value: obj.init})
TypeFuns['NumericLiteral'] = (obj: NumericLiteral) => ({ value: obj.value})
