import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    id: string

    @Column() 
    name: string  
    
    @Column()
    tgHref: string

    @Column({ type: 'jsonb', default: { wins: 0, loses: 0 } })
    stats: {
        wins: number;
        loses: number;
    }
}