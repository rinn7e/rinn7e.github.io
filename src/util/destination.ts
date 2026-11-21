import { type Destination } from '@/common/type/destination'
import { type Model, currentScreenOf } from '@/type'

// Where the app is, read from the models that show it, never stored. The
// URL is written from it (`urlWriteOf`) and read only at boot and on the
// browser's back and forward.
export const destinationOf = (model: Model): Destination => ({
  screen: currentScreenOf(model.screenModel),
})
